import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateInvoiceFormData, RecordPaymentFormData } from '$lib/types/InvoiceTypes';
import { computeVatBreakdown } from '$lib/types/InvoiceTypes';

interface CreateInvoiceParams {
	formData: CreateInvoiceFormData;
	createdBy: string;
}

interface CreateInvoiceResult {
	invoiceId: string;
	invoiceNumber: string;
}

/**
 * Creates an invoice with its line items.
 * Computes VAT breakdown server-side and persists both the invoice header and line items.
 *
 * @returns The created invoice's ID and auto-generated invoice number.
 */
export async function createInvoice(
	supabase: SupabaseClient,
	{ formData, createdBy }: CreateInvoiceParams
): Promise<CreateInvoiceResult> {
	// Compute VAT breakdown from line items
	const breakdown = computeVatBreakdown(formData.line_items);

	// Insert invoice header
	const { data: invoice, error: invoiceError } = await supabase
		.schema('api')
		.from('invoices')
		.insert({
			client_id: formData.client_id,
			application_id: formData.application_id,
			issue_date: formData.issue_date,
			due_date: formData.due_date || null,
			status: 'Draft',
			notes: formData.notes || null,
			vatable_sales: breakdown.vatableSales,
			vat_amount: breakdown.vatAmount,
			vat_exempt_sales: breakdown.vatExemptSales,
			zero_rated_sales: breakdown.zeroRatedSales,
			total_amount: breakdown.totalAmount,
			created_by: createdBy
		})
		.select('invoice_id, invoice_number')
		.single();

	if (invoiceError || !invoice) {
		throw new Error(`Failed to create invoice: ${invoiceError?.message}`);
	}

	// Insert line items
	const lineItemsToInsert = formData.line_items.map((item, idx) => ({
		invoice_id: invoice.invoice_id,
		description: item.description,
		quantity: item.quantity,
		unit_cost: item.unit_cost,
		total_amount: item.quantity * item.unit_cost,
		line_type: item.line_type,
		is_vatable: item.is_vatable,
		sort_order: idx
	}));

	const { error: lineItemsError } = await supabase
		.schema('api')
		.from('invoice_line_items')
		.insert(lineItemsToInsert);

	if (lineItemsError) {
		throw new Error(`Failed to create line items: ${lineItemsError.message}`);
	}

	return {
		invoiceId: invoice.invoice_id,
		invoiceNumber: invoice.invoice_number
	};
}

/**
 * Updates a draft invoice's header fields and replaces all line items.
 * Only invoices with status 'Draft' can be edited.
 */
export async function updateInvoice(
	supabase: SupabaseClient,
	invoiceId: string,
	formData: CreateInvoiceFormData
): Promise<void> {
	const breakdown = computeVatBreakdown(formData.line_items);

	// Update invoice header
	const { error: updateError } = await supabase
		.schema('api')
		.from('invoices')
		.update({
			client_id: formData.client_id,
			application_id: formData.application_id,
			issue_date: formData.issue_date,
			due_date: formData.due_date || null,
			notes: formData.notes || null,
			vatable_sales: breakdown.vatableSales,
			vat_amount: breakdown.vatAmount,
			vat_exempt_sales: breakdown.vatExemptSales,
			zero_rated_sales: breakdown.zeroRatedSales,
			total_amount: breakdown.totalAmount,
			updated_at: new Date().toISOString()
		})
		.eq('invoice_id', invoiceId);

	if (updateError) {
		throw new Error(`Failed to update invoice: ${updateError.message}`);
	}

	// Delete existing line items and re-insert (simpler than diffing)
	const { error: deleteError } = await supabase
		.schema('api')
		.from('invoice_line_items')
		.delete()
		.eq('invoice_id', invoiceId);

	if (deleteError) {
		throw new Error(`Failed to clear line items: ${deleteError.message}`);
	}

	const lineItemsToInsert = formData.line_items.map((item, idx) => ({
		invoice_id: invoiceId,
		description: item.description,
		quantity: item.quantity,
		unit_cost: item.unit_cost,
		total_amount: item.quantity * item.unit_cost,
		line_type: item.line_type,
		is_vatable: item.is_vatable,
		sort_order: idx
	}));

	const { error: insertError } = await supabase
		.schema('api')
		.from('invoice_line_items')
		.insert(lineItemsToInsert);

	if (insertError) {
		throw new Error(`Failed to re-insert line items: ${insertError.message}`);
	}
}

/**
 * Updates an invoice's status to 'Sent'.
 * Only draft invoices can be sent.
 */
export async function sendInvoice(supabase: SupabaseClient, invoiceId: string): Promise<void> {
	const { error } = await supabase
		.schema('api')
		.from('invoices')
		.update({ status: 'Sent', updated_at: new Date().toISOString() })
		.eq('invoice_id', invoiceId);

	if (error) {
		throw new Error(`Failed to send invoice: ${error.message}`);
	}
}

/**
 * Cancels an invoice by setting its status to 'Cancelled'.
 */
export async function cancelInvoice(supabase: SupabaseClient, invoiceId: string): Promise<void> {
	const { error } = await supabase
		.schema('api')
		.from('invoices')
		.update({ status: 'Cancelled', updated_at: new Date().toISOString() })
		.eq('invoice_id', invoiceId);

	if (error) {
		throw new Error(`Failed to cancel invoice: ${error.message}`);
	}
}

interface RecordPaymentResult {
	paymentId: string;
	receiptNumber: string;
}

/**
 * Records a payment against an invoice.
 * The DB trigger automatically updates invoice.amount_paid, invoice.ewt_amount, and invoice.status.
 */
export async function recordPayment(
	supabase: SupabaseClient,
	formData: RecordPaymentFormData,
	recordedBy: string
): Promise<RecordPaymentResult> {
	const { data: payment, error } = await supabase
		.schema('api')
		.from('invoice_payments')
		.insert({
			invoice_id: formData.invoice_id,
			amount: formData.amount,
			payment_date: formData.payment_date,
			payment_method: formData.payment_method,
			ewt_amount: formData.ewt_amount,
			ewt_rate: formData.ewt_rate,
			notes: formData.notes || null,
			recorded_by: recordedBy
		})
		.select('payment_id, receipt_number')
		.single();

	if (error || !payment) {
		throw new Error(`Failed to record payment: ${error?.message}`);
	}

	return {
		paymentId: payment.payment_id,
		receiptNumber: payment.receipt_number
	};
}
