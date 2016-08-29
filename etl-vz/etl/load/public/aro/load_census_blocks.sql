--Truncate aro.census_blocks
TRUNCATE aro.census_blocks CASCADE;
-- Update aro.census_blocks
INSERT INTO aro.census_blocks
(gid,statefp,countyfp,tabblock_id,name, aland,awater,intptlat,intptlon,geom)
  SELECT
    gid,
    statefp,
    countyfp,
    tabblock_id,
    name,
    aland,
    awater,
    intptlat,
    intptlon,
    ST_Transform(the_geom, 4326) AS geom
  FROM 
    tiger.tabblock;

VACUUM ANALYZE aro.census_blocks;


