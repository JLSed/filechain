-- Grant SELECT privilege on api.ip_applications view to service_role
-- to fix permission denied errors in the deadline-checker edge function
GRANT SELECT ON api.ip_applications TO service_role;
