-- 1. Drop the view api.ip_applications since it depends on paper_document_no
DROP VIEW IF EXISTS api.ip_applications;

-- 2. Drop the column paper_document_no from public.ip_applications
ALTER TABLE public.ip_applications DROP COLUMN IF EXISTS paper_document_no;

-- 3. Add column ipophil_link to public.ip_applications
ALTER TABLE public.ip_applications ADD COLUMN IF NOT EXISTS ipophil_link text;

-- 4. Re-create view api.ip_applications with ipophil_link and without paper_document_no
CREATE OR REPLACE VIEW api.ip_applications AS
 SELECT application_id,
    application_number,
    title_of_invention,
    type_of_invention_id,
    pre_protection_status_id,
    type_of_office_action_id,
    status,
    filling_date,
    fees,
    deadline,
    mailing_date,
    publication_date,
    inventor_names,
    contact_details,
    link_to_folder,
    remarks,
    created_at,
    updated_at,
    client_id,
    team_assigned,
    ipophil_link
   FROM public.ip_applications;

-- 5. Grant access permissions to the roles as they were before
GRANT INSERT, SELECT, UPDATE ON api.ip_applications TO authenticated;
GRANT SELECT ON api.ip_applications TO service_role;
