-- Remove the exec_sql function completely if it still exists
DROP FUNCTION IF EXISTS exec_sql(text);
DROP FUNCTION IF EXISTS exec_sql(sql_query text);