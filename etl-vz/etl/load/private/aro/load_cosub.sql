-- Truncate aro.cousub
TRUNCATE aro.cousub CASCADE;
-- Update ro.cousub
INSERT INTO aro.cousub
(gid, statefp, countyfp, geoid, name, aland, awater, intptlat, intptlon, geom)
  SELECT
    gid,
    statefp,
    countyfp,
    cosbidfp AS geoid,
    name,
    aland,
    awater,
    intptlat,
    intptlon,
    ST_Transform(the_geom, 4326) AS geom
  FROM tiger.cousub;

