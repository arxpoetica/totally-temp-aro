-- Table: public.aro_cousub

-- DROP TABLE public.aro_cousub;

CREATE TABLE public.aro_cousub AS
  SELECT
    gid,
    statefp,
    countyfp,
    geoid,
    name,
    aland,
    awater,
    intptlat,
    intptlon,
    geom
  FROM tiger_cousub;

ALTER TABLE public.aro_cousub
  OWNER TO postgres;
GRANT ALL ON TABLE public.aro_cousub TO aro;

CREATE INDEX aro_cousub_geom_gist
  ON public.aro_cousub
  USING gist
  (geom);
