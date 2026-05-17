import type { SupabaseClient } from '@supabase/supabase-js';
import type { FileMetadata } from '$lib/types/DatabaseTypes';

export type ChainNodeStatus = 'pending' | 'verifying' | 'passed' | 'failed';

export interface ChainNode {
	fileId: string;
	fileName: string;
	sequence: number;
	status: ChainNodeStatus;
	isGenesis: boolean;
}

export interface ChainIntegrityResult {
	nodes: ChainNode[];
	overallPassed: boolean;
}

type NodeCallback = (nodes: ChainNode[], currentIndex: number) => void;

/**
 * Builds the initial chain node list from the revision files array
 * (expected to be ordered genesis → latest).
 */
export function createChainNodes(files: FileMetadata[]): ChainNode[] {
	return files.map((file, i) => ({
		fileId: file.file_id,
		fileName: file.file_name,
		sequence: file.file_ledger?.[0]?.sequence ?? i,
		status: 'pending' as ChainNodeStatus,
		isGenesis: i === 0
	}));
}

/**
 * Runs the full chain integrity verification.
 *
 * For each revision (genesis → latest), it:
 *  1. Re-fetches the file metadata from the database
 *  2. Validates the file hash is present and well-formed
 *  3. Validates the ledger entry exists with a valid signature
 *  4. Validates the `previous_block` linkage to the prior revision
 *
 * Calls `onUpdate` after each node transitions so the UI can animate.
 */
export async function runChainIntegrityCheck(
	supabase: SupabaseClient,
	files: FileMetadata[],
	onUpdate: NodeCallback
): Promise<ChainIntegrityResult> {
	const nodes = createChainNodes(files);
	let allPassed = true;

	const setNode = (index: number, status: ChainNodeStatus): void => {
		nodes[index] = { ...nodes[index], status };
		onUpdate([...nodes], index);
	};

	// We'll track the previous block_id as we walk the chain
	let expectedPreviousBlock: string | null = null;

	for (let i = 0; i < files.length; i++) {
		setNode(i, 'verifying');

		// Small delay for visual effect
		await delay(400);

		try {
			// Re-fetch fresh metadata
			const { data: freshData, error } = await supabase
				.schema('api')
				.from('file_metadata')
				.select(
					'file_id, file_name, file_hash, file_ledger(block_id, sequence, signature, previous_block)'
				)
				.eq('file_id', files[i].file_id)
				.single();

			if (error || !freshData) {
				setNode(i, 'failed');
				allPassed = false;
				continue;
			}

			const fresh = freshData as unknown as FileMetadata;
			const ledger = fresh.file_ledger?.[0];

			// Check 1: File hash must be present and valid hex
			if (!fresh.file_hash || !/^[0-9a-f]{64}$/i.test(fresh.file_hash)) {
				setNode(i, 'failed');
				allPassed = false;
				continue;
			}

			// Check 2: Ledger entry must exist
			if (!ledger) {
				setNode(i, 'failed');
				allPassed = false;
				continue;
			}

			// Check 3: Signature must be present and valid hex
			if (!ledger.signature || !/^[0-9a-f]{64}$/i.test(ledger.signature)) {
				setNode(i, 'failed');
				allPassed = false;
				continue;
			}

			// Check 4: Chain linkage
			if (i === 0) {
				// Genesis block: previous_block must be null
				if (ledger.previous_block !== null) {
					setNode(i, 'failed');
					allPassed = false;
					continue;
				}
			} else {
				// Subsequent blocks: previous_block must match the prior block's block_id
				if (ledger.previous_block !== expectedPreviousBlock) {
					setNode(i, 'failed');
					allPassed = false;
					continue;
				}
			}

			// All checks passed for this node
			expectedPreviousBlock = ledger.block_id;
			setNode(i, 'passed');
		} catch {
			setNode(i, 'failed');
			allPassed = false;
		}
	}

	return { nodes, overallPassed: allPassed };
}

function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
