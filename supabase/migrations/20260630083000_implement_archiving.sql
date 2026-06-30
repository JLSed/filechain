-- Migration: Add archiving support to client_profiles, ip_applications, and file_metadata
-- Adds is_archived + archived_at columns, updates api views to filter archived rows,
-- creates archived-only views, and inserts new archive permissions.

BEGIN;

-- ============================================================
-- 1. Add columns to public tables
-- ============================================================

ALTER TABLE public.client_profiles
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

ALTER TABLE public.ip_applications
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

ALTER TABLE public.file_metadata
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;

-- ============================================================
-- 2. Recreate api views (filter out archived rows)
-- ============================================================

-- Drop existing views first (required because we change the WHERE clause)
DROP VIEW IF EXISTS api.client_profiles;
DROP VIEW IF EXISTS api.ip_applications;
DROP VIEW IF EXISTS api.file_metadata;

CREATE VIEW api.client_profiles AS
SELECT
  client_id, first_name, middle_name, last_name, email,
  mobile_number, nationality, company_name, company_address,
  created_at, updated_at, is_individual,
  tin, business_style, registered_address,
  is_archived, archived_at
FROM public.client_profiles
WHERE is_archived = false;

CREATE VIEW api.ip_applications AS
SELECT
  application_id, application_number, title_of_invention,
  type_of_invention_id, pre_protection_status_id, type_of_office_action_id,
  status, filling_date, fees, deadline, mailing_date, publication_date,
  inventor_names, contact_details, link_to_folder, remarks,
  created_at, updated_at, client_id, team_assigned, ipophil_link,
  is_archived, archived_at
FROM public.ip_applications
WHERE is_archived = false;

CREATE VIEW api.file_metadata AS
SELECT
  file_id, uploader_id, file_name, file_path, file_hash,
  uploaded_at, file_nonce, size, status, category, application_id,
  is_archived, archived_at
FROM public.file_metadata
WHERE is_archived = false;

-- ============================================================
-- 3. Restore grants on recreated views
-- ============================================================

-- client_profiles
GRANT SELECT, INSERT, UPDATE, DELETE ON api.client_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.client_profiles TO service_role;

-- ip_applications
GRANT SELECT, INSERT, UPDATE, DELETE ON api.ip_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.ip_applications TO service_role;

-- file_metadata
GRANT SELECT, INSERT, UPDATE, DELETE ON api.file_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.file_metadata TO service_role;

-- ============================================================
-- 4. Create archived-only views (for admin settings page)
-- ============================================================

CREATE VIEW api.archived_client_profiles AS
SELECT
  client_id, first_name, middle_name, last_name, email,
  company_name, is_individual, archived_at
FROM public.client_profiles
WHERE is_archived = true;

CREATE VIEW api.archived_ip_applications AS
SELECT
  application_id, application_number, title_of_invention,
  status, client_id, team_assigned, archived_at
FROM public.ip_applications
WHERE is_archived = true;

CREATE VIEW api.archived_file_metadata AS
SELECT
  file_id, file_name, application_id, size, category, archived_at
FROM public.file_metadata
WHERE is_archived = true;

-- Grants for archived views
GRANT SELECT, INSERT, UPDATE, DELETE ON api.archived_client_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.archived_client_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.archived_ip_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.archived_ip_applications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.archived_file_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api.archived_file_metadata TO service_role;

-- ============================================================
-- 5. Insert new permissions
-- ============================================================

INSERT INTO public.permissions (permission_id, key, label, description, category, sort_order) VALUES
  (gen_random_uuid(), 'clients.archive', 'Archive Clients', 'Archive and restore client profiles.', 'Clients', 402),
  (gen_random_uuid(), 'applications.archive', 'Archive Applications', 'Archive and restore IP applications.', 'Applications', 203),
  (gen_random_uuid(), 'files.archive', 'Archive Files', 'Archive and restore files.', 'Files', 304)
ON CONFLICT (key) DO NOTHING;

COMMIT;
