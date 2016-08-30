-- Make locations out of towers.towers (towers source master) table

-- Make locations out of towers.towers (towers source master) table
INSERT INTO aro.locations(city, lat, lon, geom, geog)
    SELECT DISTINCT ON (lat, lon)
        t.city,
        t.lat,
        t.lon, 
        t.geom,
        t.geog
    FROM towers.towers t;

-- Map towers.towers to newly created locations
INSERT INTO aro.towers(location_id, parcel_city, lat, lon, geom, geog)
    SELECT
        l.id,
        t.city,
        t.lat,
        t.lon,
        t.geom,
        t.geog
    FROM towers.towers t
    JOIN aro.locations l
        ON ST_Equals(l.geom, t.geom);