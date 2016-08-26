-- Make locations out of TAMs
INSERT INTO aro.locations(address, lat, lon, geom, geog)
    SELECT DISTINCT ON (arcgis_latitude, arcgis_longitude)
        b.street_addr,
        b.arcgis_latitude,
        b.arcgis_longitude,
        ST_SetSRID(ST_MakePoint(b.arcgis_longitude, b.arcgis_latitude), 4326) AS geom,
        ST_SetSRID(ST_MakePoint(b.arcgis_longitude, b.arcgis_latitude), 4326)::geography AS geog
    FROM businesses.tam b
    JOIN aro.wirecenter_subset wc
        ON ST_Within(ST_SetSRID(ST_MakePoint(b.arcgis_longitude, b.arcgis_latitude), 4326), wc.geom)
    WHERE 
    b.arcgis_latitude != 0 
    AND b.arcgis_longitude != 0;

-- Make locations out of VZ Customers
INSERT INTO aro.locations(address, lat, lon, geom, geog)
    SELECT DISTINCT ON (lat, long)
        prism_formatted_address,
        lat,
        long,
        ST_SetSRID(ST_MakePoint(long, lat), 4326) AS geom,
        ST_SetSRID(ST_MakePoint(long, lat), 4326)::geography AS geog
    FROM businesses.vz_customers b
    JOIN aro.wirecenter_subset wc
        ON ST_Within(ST_SetSRID(ST_MakePoint(b.long, b.lat), 4326), wc.geom);

INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, geog, geom)
	SELECT
		l.id AS location_id,
		b.sic4 AS industry_id,
		b.business AS name,
		b.address AS address,
		b.emps AS number_of_employees,
		b.geog AS geog,
		b.geog::geometry AS geom
	FROM businesses.infousa b
	JOIN aro.locations l
		ON ST_Equals(l.geom, b.geog::geometry);




