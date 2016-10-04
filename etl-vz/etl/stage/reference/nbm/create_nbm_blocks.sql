-- Functions for NBM stage tables

-- 1. Create a state parition table for NBM blocks
-- 2. Create indexes on a given state's NBM blocks table
-- 3. Create master competitor speed category table
-- 4. Create competitor speed category tables by state (inherit from master competitor speed category table)
-- 5. Load a competitor speed category partition


-- Create paritioned table for NBM blocks from a given state
CREATE OR REPLACE FUNCTION create_nbm_blocks_table(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    prefix_name text;
    index_prefix_name text;
    scoped_table_name text;
    state_name text;
BEGIN
    state_name := lower(state_abbrev);
    base_table_name := 'blocks';
    scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
    prefix_name := target_schema_name || '_' || base_table_name || '_' || state_name || '_';
    index_prefix_name := prefix_name || '_' || state_name || '_';

    EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';
    EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (
			objectid varchar,
			frn varchar,
			provname varchar,
			dbname varchar,
			hoconum varchar,
			hoconame varchar,
			stateabbr varchar,
			fullfipsid varchar,
			transtech varchar,
			maxaddown int,
			maxadup int,
			typicdown int,
			typicup int,
			downloadspeed int,
			uploadspeed int,
			provider_type int,
			end_user_cat int,
			CONSTRAINT ' || index_prefix_name || '_pkey PRIMARY KEY (objectid)
     );';
    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

-- Index fullfipsid
CREATE OR REPLACE FUNCTION create_nbm_blocks_indexes(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
    base_table_name text;
    prefix_name text;
    index_prefix_name text;
    scoped_table_name text;
    state_name text;
BEGIN
    state_name := lower(state_abbrev);
    base_table_name := 'blocks';
    scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
    prefix_name := target_schema_name || '_' || base_table_name || '_' || state_name || '_';
    index_prefix_name := prefix_name || '_' || state_name || '_';

    EXECUTE 'CREATE INDEX ' || index_prefix_name || 'fullfipsid_index ON ' || scoped_table_name || ' (fullfipsid);';
    RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

-- Create the competitor speed category master table from which the partitions inherit
CREATE OR REPLACE FUNCTION create_competitor_speed_category_master_table(target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
	scoped_table_name text;
	base_table_name text;
	index_prefix_name text;
BEGIN
	base_table_name := 'competitor_speed_category';
	scoped_table_name := target_schema_name || '.' || base_table_name;
	index_prefix_name := target_schema_name || '_' || base_table_name || '_';

	EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ';';
	EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (
		gid integer,
		provname varchar,
		stateabbr varchar,
		speed_category int
	);';
	EXECUTE 'CREATE INDEX ' || index_prefix_name || 'gid_index ON ' || scoped_table_name || ' (gid);';
	EXECUTE 'CREATE INDEX ' || index_prefix_name || 'stateabbr_index ON ' || scoped_table_name || ' (stateabbr);';
	RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

-- Create competitor speed category partition 
CREATE OR REPLACE FUNCTION create_competitor_speed_category_partition(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
	base_table_name text;
	prefix_name text;
	index_prefix_name text;
	scoped_table_name text;
	state_name text;
	state_name_upper text;
BEGIN
	state_name := lower(state_abbrev);
	state_name_upper := upper(state_abbrev);
	base_table_name := 'competitor_speed_category';
	scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
	prefix_name := target_schema_name || '_' || base_table_name || '_' || state_name || '_';
	index_prefix_name := prefix_name || '_' || state_name || '_';

	EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ';';
	EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (CHECK (upper(stateabbr) = ''' || state_name_upper || ''')) INHERITS (nbm.competitor_speed_category);';
	EXECUTE 'CREATE INDEX ' || index_prefix_name || 'gid_index ON ' || scoped_table_name || ' (gid);';
	EXECUTE 'CREATE INDEX ' || index_prefix_name || 'stateabbr_index ON ' || scoped_table_name || ' (stateabbr);';
	RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

-- Load the competitor speed category partition
CREATE OR REPLACE FUNCTION load_competitor_speed_category_partition(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
	base_table_name text;
	prefix_name text;
	index_prefix_name text;
	scoped_table_name text;
	state_name text;
	state_name_upper text;
	blocks_table text;
	scoped_blocks_table_name text;
	tiger_blocks_table_name text;
BEGIN
	state_name := lower(state_abbrev);
	state_name_upper := upper(state_abbrev);
	base_table_name := 'competitor_speed_category';
	scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
	prefix_name := target_schema_name || '_' || base_table_name || '_' || state_name || '_';
	index_prefix_name := prefix_name || '_' || state_name || '_';
	blocks_table := 'blocks_' || state_name;
	scoped_blocks_table_name := target_schema_name || '.' || blocks_table;

	EXECUTE 'INSERT INTO ' || scoped_table_name || ' (gid, provname, stateabbr, speed_category) 
		SELECT
			gid,
			provname,
			''' || state_name_upper || ''',
			max(
			CASE WHEN maxaddown = 2 THEN 1
				WHEN maxaddown = 3 THEN 2
				WHEN maxaddown = 4 THEN 2
				WHEN maxaddown = 5 THEN 3
				WHEN maxaddown = 6 THEN 3
				WHEN maxaddown = 7 THEN 4
				WHEN maxaddown = 8 THEN 5
				WHEN maxaddown = 9 THEN 6
				WHEN maxaddown = 10 THEN 7
				ELSE 10
			END) AS speed_category
		FROM ' || scoped_blocks_table_name || ' n 
		JOIN tiger.tabblock b 
			ON b.tabblock_id = n.fullfipsid
		WHERE name NOT LIKE ''%Verizon%''
		AND upper(stateabbr) = ''' || state_name_upper || '''
		GROUP BY b.gid, provname, stateabbr;';
	RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;






