-- Table: aro.cousub

-- DROP TABLE aro.cousub;

CREATE TABLE aro.cousub AS
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


ALTER TABLE aro.cousub
  ADD CONSTRAINT pk_aro_cousub PRIMARY KEY (geoid);


CREATE INDEX aro_cousub_geom_gist
  ON aro.cousub
  USING gist
  (geom);
