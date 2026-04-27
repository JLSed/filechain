import { LINE_ITEM_TYPES, PAYMENT_METHODS } from '$lib/constants/SchemaData';
import * as z from 'zod';

// ── Line Item Form Schema ──

export const LineItemFormSchema = z.object({
	description: z.string().min(1, { message: 'Description is required' }),
	quantity: z.number().int().positive({ message: 'Quantity must be at least 1' }),
	unit_cost: z.number().nonnegative({ message: 'Unit cost must be 0 or greater' }),
	line_type: z.enum(LINE_ITEM_TYPES),
	is_vatable: z.boolean()
});

export type LineItemFormData = z.infer<typeof LineItemFormSchema>;

// ── Create Invoice Form Schema ──

export const CreateInvoiceFormSchema = z.object({
	client_id: z.string().uuid({ message: 'Please select a client' }),
	application_id: z.string().uuid({ message: 'Please select an application' }),
	issue_date: z.string().min(1, { message: 'Issue date is required' }),
	due_date: z.string().optional().default(''),
	notes: z.string().optional().default(''),
	line_items: z.array(LineItemFormSchema).min(1, { message: 'At least one line item is required' })
});

export type CreateInvoiceFormData = z.infer<typeof CreateInvoiceFormSchema>;

// ── Record Payment Form Schema ──

export const RecordPaymentFormSchema = z.object({
	invoice_id: z.string().uuid(),
	amount: z.number().positive({ message: 'Payment amount must be greater than 0' }),
	payment_date: z.string().min(1, { message: 'Payment date is required' }),
	payment_method: z.enum(PAYMENT_METHODS),
	ewt_rate: z.number().min(0).max(1).nullable().default(null),
	ewt_amount: z.number().nonnegative().default(0),
	notes: z.string().optional().default('')
});

export type RecordPaymentFormData = z.infer<typeof RecordPaymentFormSchema>;

// ── VAT Breakdown Helper ──

export interface VatBreakdown {
	/** Sum of vatable line item totals ÷ 1.12 (net of VAT) */
	vatableSales: number;
	/** 12% VAT on vatable sales */
	vatAmount: number;
	/** Sum of non-vatable (VAT-exempt) line items */
	vatExemptSales: number;
	/** Zero-rated sales (default 0) */
	zeroRatedSales: number;
	/** Grand total of all line items */
	totalAmount: number;
}

/**
 * Computes BIR-compliant VAT breakdown from line items.
 *
 * Professional fees are vatable (12% inclusive):
 *   vatableSales = sum(vatable totals) / 1.12
 *   vatAmount = vatableSales × 0.12
 *
 * Disbursements (IPOPHL fees) are VAT-exempt.
 */
export function computeVatBreakdown(
	lineItems: Array<{ quantity: number; unit_cost: number; is_vatable: boolean }>
): VatBreakdown {
	let vatableTotal = 0;
	let exemptTotal = 0;

	for (const item of lineItems) {
		const lineTotal = item.quantity * item.unit_cost;
		if (item.is_vatable) {
			vatableTotal += lineTotal;
		} else {
			exemptTotal += lineTotal;
		}
	}

	// Vatable amounts are VAT-inclusive; extract the net sales and VAT
	const vatableSales = Math.round((vatableTotal / 1.12) * 100) / 100;
	const vatAmount = Math.round(vatableSales * 0.12 * 100) / 100;

	return {
		vatableSales,
		vatAmount,
		vatExemptSales: exemptTotal,
		zeroRatedSales: 0,
		totalAmount: vatableTotal + exemptTotal
	};
}
