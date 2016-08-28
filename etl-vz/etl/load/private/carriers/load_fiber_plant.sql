TRUNCATE aro.fiber_plant CASCADE;

-- Load the data we need from geotel.fiber_plant into aro.fiber_plant
-- We'll preserve all carriers' fiber plant in the aro.fiber_plant table, but only one set (the '"client's") will be added to the graph.
INSERT INTO aro.fiber_plant (gid, carrier_name, cbsa, state, plant_type, zipcode, geog, geom)
	SELECT
		gid,
		carrier AS carrier_name,
		cbsa,
		state,
		type AS plant_type,
		zip AS zipcode,
		Geography(ST_GeometryN(ST_Force_2D(the_geom),1)) as geog, -- Use ST_Force_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_GeometryN(ST_Force_2D(the_geom),1) AS geom -- Use ST_Force_2D because the source shapefiles have geometry type MultiLineStringZ...
	FROM geotel.fiber_plant;

UPDATE aro.fiber_plant SET buffer_geom=ST_Buffer(geog, 152.4)::geometry;

UPDATE aro.fiber_plant SET carrier_id=(SELECT id FROM aro.carriers WHERE carriers.name=fiber_plant.carrier_name);
