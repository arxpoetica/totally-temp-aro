-- Table: aro.census_blocks

DROP TABLE IF EXISTS aro.census_blocks;

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


ALTER TABLE aro.census_blocks
  ADD CONSTRAINT pk_aro_census_blocks PRIMARY KEY (tabblock_id);


CREATE INDEX aro_census_blocks_geom_gist
  ON aro.census_blocks
  USING gist
  (geom);

VACUUM ANALYZE aro.census_blocks;
