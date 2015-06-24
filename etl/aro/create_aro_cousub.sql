-- Table: public.aro_cousub

-- DROP TABLE public.aro_cousub;

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
    the_geom AS geom
  FROM tiger.cousub;


ALTER TABLE aro.cousub
  ADD CONSTRAINT pk_aro_cousub PRIMARY KEY (geoid);


CREATE INDEX aro_cousub_geom_gist
  ON aro.cousub
  USING gist
  (geom);
