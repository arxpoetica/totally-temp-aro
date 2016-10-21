CREATE OR REPLACE FUNCTION client.create_census_block_carriers_partition(state_abbrev text, target_schema text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    scoped_table_name text;
    state_name text;
    state_name_upper text;
BEGIN
    state_name := lower(state_abbrev);
    state_name_upper := upper(state_abbrev);
    base_table_name := 'census_blocks_carriers';
    scoped_table_name := target_schema || '.' || base_table_name || '_' || state_name;

	EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';
	EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (CHECK (upper(state) = ''' || state_name_upper || ''')) INHERITS (client.census_blocks_carriers);';
	EXECUTE 'ALTER TABLE ' || scoped_table_name || ' ADD PRIMARY KEY (census_block_gid, carrier_id);';
	EXECUTE 'ALTER TABLE ' || scoped_table_name || ' ADD FOREIGN KEY (carrier_id) REFERENCES aro.carriers (id) ON DELETE CASCADE;';

	RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION client.load_census_block_carriers_partition(state_abbrev text, target_schema text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    scoped_table_name text;
    source_schema text;
    base_source_table text;
    scoped_source_table text;
    state_name text;
    state_name_upper text;
BEGIN
    state_name := lower(state_abbrev);
    state_name_upper := upper(state_abbrev);
    base_table_name := 'census_blocks_carriers';
    source_schema := 'nbm_data';
    base_source_table := 'blocks';
    scoped_table_name := target_schema || '.' || base_table_name || '_' || state_name;
    scoped_source_table := source_schema || '.' || base_source_table || '_' || state_name;

    EXECUTE 'INSERT INTO ' || scoped_table_name || ' (census_block_gid, state, carrier_id, download_speed, upload_speed) 
    	SELECT
    		cb.gid AS census_block_gid,
    		''' || state_name_upper || ''',
    		c.id AS carrier_id,
    		MAX(blks.maxaddown) AS download_speed,
    		MAX(blks.maxadup) AS upload_speed
    	FROM aro.census_blocks cb
    	JOIN ' || scoped_source_table || ' blks 
    	ON cb.tabblock_id = blks.fullfipsid
    	JOIN aro.carriers c
    	ON LOWER(c.name) = LOWER(blks.hoconame)
    	WHERE c.route_type = ''ilec'' 
    	GROUP BY census_block_gid, carrier_id;';
    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;