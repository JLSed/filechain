BEGIN;

CREATE OR REPLACE FUNCTION api.get_system_metrics()
RETURNS json SECURITY DEFINER AS $$
DECLARE
  db_size bigint;
  active_conns bigint;
  cache_hit_ratio double precision;
BEGIN
  SELECT pg_database_size(current_database()) INTO db_size;

  SELECT count(*) INTO active_conns FROM pg_stat_activity;

  SELECT
    CASE
      WHEN (sum(heap_blks_read) + sum(heap_blks_hit)) = 0 THEN 100.0
      ELSE (sum(heap_blks_hit)::double precision / (sum(heap_blks_read) + sum(heap_blks_hit))::double precision) * 100.0
    END INTO cache_hit_ratio
  FROM pg_statio_user_tables;

  RETURN json_build_object(
    'db_size_bytes', db_size,
    'active_connections', active_conns,
    'cache_hit_ratio', round(cache_hit_ratio::numeric, 2)
  );
END;
$$ LANGUAGE plpgsql;

REVOKE EXECUTE ON FUNCTION api.get_system_metrics() FROM public;
GRANT EXECUTE ON FUNCTION api.get_system_metrics() TO service_role;

COMMIT;
