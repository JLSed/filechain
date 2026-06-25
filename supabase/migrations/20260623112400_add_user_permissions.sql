-- Create user_permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    user_id UUID NOT NULL REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(permission_id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    granted_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, permission_id)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all user permissions
CREATE POLICY "Authenticated read user_permissions" ON public.user_permissions
    FOR SELECT TO authenticated USING (true);

-- Create API view
CREATE OR REPLACE VIEW api.user_permissions AS
SELECT user_id, permission_id, granted_at, granted_by FROM public.user_permissions;

GRANT SELECT ON api.user_permissions TO authenticated;
GRANT SELECT ON api.user_permissions TO service_role;

-- Seed existing user permissions from current role assignments
INSERT INTO public.user_permissions (user_id, permission_id)
SELECT up.user_id, rp.permission_id
FROM public.user_profiles up
JOIN public.role_permissions rp ON up.role = rp.role
ON CONFLICT DO NOTHING;
