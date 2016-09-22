-- Load VZ TAM businesses into aro.locations and aro.businesses tables
-- source_table = 'businesses.tam_ny', target_schema_name = 'aro_location_data', state_abbrev = 'NY'
CREATE OR REPLACE FUNCTION aro.update_shard_industries(scoped_source_table text, state_abbrev text)
RETURNS integer AS $records_loaded_count$
DECLARE
  records_loaded_count int;
  scoped_target_table text;
  update_expr text;

BEGIN
  -- Constants
  scoped_target_table := 'aro.industries';
  
  RAISE NOTICE 'UPDATING INDUSTRY CODES FOR %', state_abbrev;

  update_expr := 'WITH distinct_codes AS (
  SELECT DISTINCT ON (sic4)
    sic4 AS id,
    sic4desc AS description
  FROM ' || scoped_source_table ||'
)
,
missing_codes AS (
  SELECT dc.id, dc.description
  FROM distinct_codes dc
  LEFT JOIN ' || scoped_target_table ||' i ON i.id = dc.id
  WHERE i.id IS NULL
)
INSERT INTO ' || scoped_target_table ||'(id, description)
  SELECT 
    id,
    description
  FROM missing_codes ;';

   records_loaded_count := 0;

  EXECUTE update_expr;

  RETURN records_loaded_count;
END;
$records_loaded_count$ LANGUAGE plpgsql;