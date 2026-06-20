BEGIN;

CREATE OR REPLACE VIEW api.user_profiles AS
 SELECT up.user_id,
    up.role,
    up.first_name,
    up.middle_name,
    up.last_name,
    up.is_active,
    up.created_at,
    up.contact_number,
    up.address,
    au.email,
    (us.user_id IS NOT NULL) AS has_secret
   FROM public.user_profiles up
     LEFT JOIN auth.users au ON au.id = up.user_id
     LEFT JOIN public.user_secret us ON us.user_id = up.user_id;

COMMIT;
