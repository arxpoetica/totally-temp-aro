--Truncate aro.census_blocks
TRUNCATE aro.states CASCADE;
-- Update aro.census_blocks
INSERT INTO aro.states (gid, statefp, stusps, name, geom)
  SELECT
    gid,
    statefp,
    stusps,
    name,
    ST_Transform(the_geom, 4326) AS geom
  FROM 
    tiger_data.state;


