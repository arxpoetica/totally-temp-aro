-- Make locations out of towers.towers (towers source master) table
INSERT INTO aro.locations(city, lat, lon, geom, geog)
    SELECT DISTINCT ON (lat, lon)
        t.city,
        t.lat,
        t.lon, 
        t.geom,
        t.geog
    FROM towers.towers t
    JOIN aro.wirecenter_subset wc
        ON ST_Within(t.geom, wc.geom);


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

-- Make locations out of InfoGroup households (temp_hh.households)
INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geom, geog)
    SELECT DISTINCT ON (lat, lon)
        hh.address,
        hh.city,
        hh.state,
        hh.zip5,
        hh.lat,
        hh.lon,
        hh.geom,
        hh.geog
    FROM temp_hh.households hh
    JOIN aro.wirecenter_subset wc
        ON ST_Within(hh.geom, wc.geom);

VACUUM ANALYZE aro.locations;