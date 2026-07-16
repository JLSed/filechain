-- Create backup_logs table in public schema
CREATE TABLE IF NOT EXISTS public.backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    backup_type TEXT NOT NULL CONSTRAINT check_backup_type CHECK (backup_type IN ('scheduled', 'manual')),
    status TEXT NOT NULL CONSTRAINT check_status CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    db_file_name TEXT,
    db_file_size BIGINT,
    storage_size BIGINT,
    duration_seconds INT,
    error_message TEXT,
    triggered_by UUID REFERENCES public.user_profiles(user_id) ON DELETE SET NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Create VIEW in the api schema with security_invoker = on
CREATE OR REPLACE VIEW api.backup_logs WITH (security_invoker = on) AS
SELECT 
    id, 
    created_at, 
    backup_type, 
    status, 
    db_file_name, 
    db_file_size, 
    storage_size, 
    duration_seconds, 
    error_message, 
    triggered_by, 
    completed_at 
FROM public.backup_logs;

GRANT SELECT, INSERT, UPDATE ON api.backup_logs TO authenticated;
GRANT ALL ON api.backup_logs TO service_role;

-- Policies: Only users with System Admin role can access backup records
-- Wrap auth/session function calls in scalar subqueries for performance
CREATE POLICY "System Admins can select backup logs" ON public.backup_logs
    FOR SELECT TO authenticated 
    USING (
        (SELECT role FROM public.user_profiles WHERE user_id = (SELECT auth.uid())) = 'System Admin'
    );

CREATE POLICY "System Admins can insert backup logs" ON public.backup_logs
    FOR INSERT TO authenticated 
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE user_id = (SELECT auth.uid())) = 'System Admin'
    );

CREATE POLICY "System Admins can update backup logs" ON public.backup_logs
    FOR UPDATE TO authenticated 
    USING (
        (SELECT role FROM public.user_profiles WHERE user_id = (SELECT auth.uid())) = 'System Admin'
    );
