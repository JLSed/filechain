-- Migrate contact_details from text to text[] (array of strings)
-- to match the structure of inventor_names

DROP VIEW IF EXISTS api.ip_applications;

ALTER TABLE public.ip_applications
  ALTER COLUMN contact_details TYPE text[]
  USING CASE
    WHEN contact_details IS NOT NULL THEN ARRAY[contact_details]
    ELSE '{}'::text[]
  END;

ALTER TABLE public.ip_applications
  ALTER COLUMN contact_details SET DEFAULT '{}'::text[];

CREATE OR REPLACE VIEW api.ip_applications AS
  SELECT application_id, application_number, title_of_invention,
         type_of_invention_id, pre_protection_status_id, type_of_office_action_id,
         status, filling_date, paper_document_no, fees, deadline,
         mailing_date, publication_date, inventor_names, contact_details,
         link_to_folder, remarks, created_at, updated_at, client_id, team_assigned
  FROM public.ip_applications;

GRANT SELECT, INSERT, UPDATE ON api.ip_applications TO authenticated;
GRANT SELECT ON api.ip_applications TO service_role;
