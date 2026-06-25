BEGIN;

CREATE OR REPLACE FUNCTION api.get_storage_metrics()
RETURNS json SECURITY DEFINER AS $$
DECLARE
  storage_size bigint;
  total_files bigint;
BEGIN
  SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) INTO storage_size FROM storage.objects;
  SELECT COUNT(*) INTO total_files FROM storage.objects;

  RETURN json_build_object(
    'storage_size_bytes', storage_size,
    'total_files_count', total_files
  );
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION api.get_storage_metrics() FROM public;
GRANT EXECUTE ON FUNCTION api.get_storage_metrics() TO service_role;

COMMIT;
