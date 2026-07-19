-- Alter invoice_payments table to add proof_image_path
ALTER TABLE public.invoice_payments 
ADD COLUMN IF NOT EXISTS proof_image_path TEXT;

-- Recreate the api view to include the new column
-- View Security Invariant: ALWAYS define views with WITH (security_invoker = on)
CREATE OR REPLACE VIEW api.invoice_payments 
WITH (security_invoker = on) AS
SELECT 
    payment_id,
    invoice_id,
    receipt_number,
    amount,
    payment_date,
    payment_method,
    ewt_amount,
    ewt_rate,
    notes,
    recorded_by,
    created_at,
    proof_image_path
FROM public.invoice_payments;

-- Re-grant privileges on the view
GRANT SELECT, INSERT, UPDATE ON api.invoice_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON api.invoice_payments TO anon;
GRANT ALL ON api.invoice_payments TO service_role;
