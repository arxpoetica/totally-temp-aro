-- Table: public.aro_cousub

-- DROP TABLE public.aro_cousub;

CREATE TABLE public.aro_cousub AS
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


CREATE INDEX aro_cousub_geom_gist
  ON public.aro_cousub
  USING gist
  (geom);
