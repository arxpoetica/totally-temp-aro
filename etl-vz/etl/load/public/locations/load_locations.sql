DO $$
DECLARE
    all_states text[][] := array[['NY', '36'], ['WA', '53']];
    state text[];
    current_table text;
    insert_expr text;

BEGIN
	-- Load already paritioned unique InfoUSA business locations into aro_data.locations_XX tables
	FOREACH state SLICE 1 IN ARRAY all_states
	LOOP


  -- 1. Create unique locs table for each state
  -- 2. Do what aro.towers does
  -- 
	
  RAISE NOTICE '*** LOADING UNIQUE INFOUSA LOCATIONS FOR: %', state[1];
  current_table := 'aro_data.locations_' || lower(state[1]);
  
  insert_expr := 'INSERT INTO ' || current_table || ' (address, city, state, zipcode, lat, lon, geog, geom) 
  	SELECT DISTINCT (bldgid)
  		address,
  		city,
  		b.state,
  		zip,
  		lat,
  		long,
  		b.geog,
  		b.geog::geometry
  	FROM project_constraints.spatial pc, 
  	ref_businesses_data.infousa_' || lower(state[1]) || ' b
  	WHERE ST_Contains(pc.geom, b.geog::geometry)
  	AND b.state = ''' || state[1] || ''';';

  EXECUTE insert_expr;

  -- Load already partitioned unique InfoUSA Households into aro_data.locations_XX tables;
  -- TODO only load HH locations which are not already in the locations tables at this point

  RAISE NOTICE '**** LOADING UNIQUE HOUSEHOLD LOCATIONS FOR: %', state[1];
  insert_expr := 
  END LOOP;

END$$;