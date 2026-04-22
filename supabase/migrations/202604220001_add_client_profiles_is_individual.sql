begin;

alter table public.client_profiles
	add column if not exists is_individual boolean not null default true;

create or replace view api.client_profiles as
select
	client_id,
	first_name,
	middle_name,
	last_name,
	email,
	mobile_number,
	nationality,
	company_name,
	company_address,
	created_at,
	updated_at,
	is_individual
from public.client_profiles;

comment on column public.client_profiles.is_individual is
	'Client profile type flag: true for individual clients, false for company/organization clients.';

-- Note: In the current schema, api.client_profiles is an auto-updatable view with
-- no INSTEAD OF INSERT/UPDATE triggers or rewrite rules to update.

commit;
