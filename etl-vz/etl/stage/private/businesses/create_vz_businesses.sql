-- Create partitions for Verizon TAM businesses
CREATE OR REPLACE FUNCTION create_vz_tam_table(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
	state_name text;
	base_table_name text;
	scoped_table_name text;
	index_prefix text;
BEGIN
	state_name := lower(state_abbrev);
	base_table_name := 'tam';
	scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;
	index_prefix := target_schema_name || '_' || base_table_name || '_' || state_name;
 
	EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';
	EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (
		duns_number varchar,
		gduns varchar,
		total_tam_2015 numeric,
		emp_tot int,
		emp_here int,
		business_nm varchar,
		secondary_nm varchar,
		street_addr varchar,
		city varchar,
		state varchar,
		zip_cd varchar,
		latitude double precision,
		longitude double precision,
		bemfab varchar,
		cottage_file_ind varchar,
		cpl_cd varchar,
		num_of_co_in_bldg int
	);';
	EXECUTE 'CREATE INDEX ' || index_prefix || '_duns_number_index ON ' || scoped_table_name || ' (duns_number);';
	RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;

-- Create partitions for VZ Customers businesses
CREATE OR REPLACE FUNCTION create_vz_customers_table(state_abbrev text, target_schema_name text)
RETURNS text AS $scoped_table_name$
DECLARE
	state_name text;
	base_table_name text;
	scoped_table_name text;
BEGIN
	state_name := lower(state_abbrev);
	base_table_name := 'vz_customers';
	scoped_table_name := target_schema_name || '.' || base_table_name || '_' || state_name;

	EXECUTE 'DROP TABLE IF EXISTS ' || scoped_table_name || ' CASCADE;';
	EXECUTE 'CREATE TABLE ' || scoped_table_name || ' (
		conc varchar,
		state varchar,
		csalt_lata varchar,
		csalt_address_id varchar,
		srv_code varchar,
		wc_flag varchar,
		sub_ds1 numeric,
		ds1 numeric,
		ds3 numeric,
		oc3 numeric,
		oc12 numeric,
		oc48 numeric,
		oc192 numeric,
		oc768 numeric,
		ocn numeric,
		ethernet numeric,
		blank numeric,
		grand_total numeric,
		pprint_addy varchar,
		prism_source varchar,
		prism_formatted_address varchar,
		prism_rating varchar,
		prism_long double precision,
		prism_lat double precision
	);';
	RETURN scoped_table_name;
END;
$scoped_table_name$ LANGUAGE plpgsql;


