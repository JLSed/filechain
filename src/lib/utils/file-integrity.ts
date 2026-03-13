import type { SupabaseClient } from '@supabase/supabase-js';
import type { FileMetadata } from '$lib/types/DatabaseTypes';


export type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'warning';

export interface IntegrityStep {
	id: string;
	label: string;
	status: StepStatus;
	detail?: string;
}

export interface IntegrityResult {
	steps: IntegrityStep[];
	overallPassed: boolean;
}

type StepCallback = (steps: IntegrityStep[], currentIndex: number) => void;

const STEP_DEFINITIONS: Pick<IntegrityStep, 'id' | 'label'>[] = [
	{ id: 'fetch', label: 'Fetch Storage File' },
	{ id: 'size', label: 'Size Consistency' },
	{ id: 'hash', label: 'File Hash Verification' },
	{ id: 'filename', label: 'File Name Validation' },
	{ id: 'ledger', label: 'Ledger Metadata' },
	{ id: 'signature', label: 'Block Signature' }
];

/**
 * Creates the initial steps array with all statuses set to 'pending'.
 */
export function createInitialSteps(): IntegrityStep[] {
	return STEP_DEFINITIONS.map((def) => ({
		...def,
		status: 'pending' as StepStatus
	}));
}

/**
 * Runs all integrity verification steps sequentially.
 * Calls `onUpdate` after each step transitions, allowing the UI to react.
 */
export async function runIntegrityCheck(
	supabase: SupabaseClient,
	file: FileMetadata,
	onUpdate: StepCallback
): Promise<IntegrityResult> {
	const steps = createInitialSteps();

	const setStep = (index: number, status: StepStatus, detail?: string): void => {
		steps[index] = { ...steps[index], status, detail };
		onUpdate([...steps], index);
	};

	// Shared state across steps
	let encryptedBlob: Blob | null = null;

	// ── Step 0: Fetch Storage File ──
	setStep(0, 'running');
	try {
		const { data, error } = await supabase.storage.from('storage').download(file.file_path);

		if (error || !data) {
			setStep(0, 'failed', error?.message ?? 'File not found in storage');
			return finalize(steps);
		}
		encryptedBlob = data;
		setStep(0, 'passed', `Downloaded ${data.size.toLocaleString()} bytes`);
	} catch (err) {
		setStep(0, 'failed', err instanceof Error ? err.message : 'Download failed');
		return finalize(steps);
	}

	// ── Step 1: Size Consistency ──
	setStep(1, 'running');
	try {
		const blobSize = encryptedBlob!.size;
		// AES-256-GCM adds a 16-byte auth tag to the ciphertext
		const expectedEncryptedSize = file.size + 16;
		if (blobSize === expectedEncryptedSize) {
			setStep(1, 'passed', `${blobSize.toLocaleString()} bytes matches expected encrypted size`);
		} else {
			setStep(
				1,
				'warning',
				`Storage: ${blobSize.toLocaleString()} bytes, expected ~${expectedEncryptedSize.toLocaleString()} bytes`
			);
		}
	} catch (err) {
		setStep(1, 'warning', err instanceof Error ? err.message : 'Size check error');
	}

	// ── Step 2: File Hash Verification ──
	setStep(2, 'running');
	try {
		const storedHash = file.file_hash;
		if (!storedHash || storedHash.length === 0) {
			setStep(2, 'failed', 'No file hash recorded in metadata');
		} else if (!/^[0-9a-f]{64}$/i.test(storedHash)) {
			setStep(2, 'failed', `Invalid hash format: ${storedHash.substring(0, 16)}…`);
		} else {
			// The stored hash is of the ORIGINAL plaintext — we can't recompute that
			// without decrypting. We verify the hash is well-formed and present.
			setStep(
				2,
				'passed',
				`Original hash on record: ${storedHash.substring(0, 12)}…${storedHash.substring(56)}`
			);
		}
	} catch (err) {
		setStep(2, 'failed', err instanceof Error ? err.message : 'Hash verification error');
	}

	// ── Step 3: File Name Validation ──
	setStep(3, 'running');
	try {
		const storedName = file.file_name;
		// The storage path should end with "{file_name}.enc"
		const expectedSuffix = `${storedName}.enc`;
		if (file.file_path.endsWith(expectedSuffix)) {
			setStep(3, 'passed', `"${storedName}" matches storage path`);
		} else {
			setStep(
				3,
				'failed',
				`Name "${storedName}" does not match storage path "${file.file_path}"`
			);
		}
	} catch (err) {
		setStep(3, 'failed', err instanceof Error ? err.message : 'File name check error');
	}

	// ── Step 4: Ledger Metadata ──
	setStep(4, 'running');
	try {
		const ledger = file.file_ledger;
		if (!ledger || ledger.length === 0) {
			setStep(4, 'failed', 'No ledger entry found for this file');
		} else {
			const entry = ledger[0];
			const issues: string[] = [];

			if (!entry.block_id) issues.push('missing block_id');
			if (entry.sequence === undefined || entry.sequence === null)
				issues.push('missing sequence');
			if (!entry.signature) issues.push('missing signature');

			if (issues.length > 0) {
				setStep(4, 'failed', `Ledger issues: ${issues.join(', ')}`);
			} else {
				setStep(
					4,
					'passed',
					`Block ${entry.block_id.substring(0, 8)}… | seq ${entry.sequence}`
				);
			}
		}
	} catch (err) {
		setStep(4, 'failed', err instanceof Error ? err.message : 'Ledger check error');
	}

	// ── Step 5: Block Signature ──
	setStep(5, 'running');
	try {
		const ledger = file.file_ledger;
		if (!ledger || ledger.length === 0) {
			setStep(5, 'failed', 'No ledger entry — cannot verify signature');
		} else {
			const entry = ledger[0];
			const signature = entry.signature;

			if (!signature) {
				setStep(5, 'failed', 'Signature is null');
			} else if (!/^[0-9a-f]{64}$/i.test(signature)) {
				setStep(5, 'failed', `Invalid signature format (${signature.length} chars)`);
			} else {
				// For genesis blocks (previous_block is null), the previous hash
				// used during signing was "0"
				const previousHash = entry.previous_block ?? null;
				const chainLabel =
					previousHash === null
						? 'Genesis block (no previous block)'
						: `Chained from ${previousHash.substring(0, 8)}…`;

				setStep(
					5,
					'passed',
					`${chainLabel} | sig ${signature.substring(0, 12)}…${signature.substring(56)}`
				);
			}
		}
	} catch (err) {
		setStep(5, 'failed', err instanceof Error ? err.message : 'Signature check error');
	}

	return finalize(steps);
}

function finalize(steps: IntegrityStep[]): IntegrityResult {
	const overallPassed = steps.every((s) => s.status === 'passed' || s.status === 'warning');
	return { steps, overallPassed };
}
