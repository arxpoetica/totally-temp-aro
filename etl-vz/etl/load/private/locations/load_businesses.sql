TRUNCATE aro.businesses CASCADE;

INSERT INTO aro.locations(address, lat, lon, geog, geom)
	SELECT DISTINCT ON (lat, long)
		prism_formatted_address,
		lat,
		long,
		ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography AS geog,
		ST_SetSRID(ST_MakePoint(long, lat), 4326) AS geom
	FROM project_constraints.spatial wc, businesses.vz_customers b
    WHERE ST_Contains(wc.geom, ST_SetSRID(ST_MakePoint(long, lat), 4326));

INSERT INTO aro.locations(address, lat, lon, geog, geom)
	SELECT DISTINCT ON (arcgis_latitude, arcgis_longitude)
		street_addr,
		arcgis_latitude,
		arcgis_longitude,
		ST_SetSRID(ST_MakePoint(arcgis_longitude, arcgis_latitude), 4326)::geography AS geog,
		ST_SetSRID(ST_MakePoint(arcgis_longitude, arcgis_latitude), 4326) AS geom
	FROM project_constraints.spatial wc, businesses.tam b
    WHERE ST_Contains(wc.geom, ST_SetSRID(ST_MakePoint(arcgis_longitude, arcgis_latitude), 4326));


-- Insert all VZ customers
INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, annual_recurring_cost, monthly_recurring_cost, source, geog, geom)
	SELECT
		l.id,
		(SELECT id FROM aro.industries WHERE description = 'MENS & BOYS CLOTHING STORES'), -- Generic SIC4, try to force categorization as retail
		b.nasp_nm,
		b.prism_formatted_address,
		1000,
		b.sum_mrc * 12,
		b.sum_mrc,
		'vz_customers',
    ST_SetSRID(ST_MakePoint(b.long, b.lat), 4326)::geography AS geog,
    ST_SetSRID(ST_MakePoint(b.long, b.lat), 4326) AS geom
   FROM businesses.vz_customers b
   JOIN aro.locations l
   	ON ST_Equals(l.geom, ST_SetSRID(ST_MakePoint(b.long, b.lat), 4326));

-- Insert all TAMs
INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, source, geog, geom)
	SELECT
		l.id,
		(SELECT id FROM aro.industries WHERE description = 'MENS & BOYS CLOTHING STORES'), -- Generic SIC4, try to force categorization as retail
		b.business_nm,
		b.street_addr,
		b.emp_here,
		'tam',
		ST_SetSRID(ST_MakePoint(arcgis_longitude, arcgis_latitude), 4326)::geography AS geog,
    ST_SetSRID(ST_MakePoint(arcgis_longitude, arcgis_latitude), 4326) AS geom
   FROM businesses.tam b
   JOIN aro.locations l
   	ON ST_Equals(l.geom, ST_SetSRID(ST_MakePoint(arcgis_longitude, arcgis_latitude), 4326))
   WHERE 
   	arcgis_latitude != 0 
   	AND arcgis_longitude != 0;