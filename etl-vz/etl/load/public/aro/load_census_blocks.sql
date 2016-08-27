TRUNCATE TABLE aro.census_blocks CASCADE;
INSERT INTO aro.census_blocks
(gid,statefp,countyfp,tabblock_id,aland,awater,intptlat,intptlon,geom)
CREATE TABLE aro.census_blocks AS
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


