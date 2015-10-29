-- Table: cousub

DROP TABLE IF EXISTS aro.cousub;

CREATE TABLE aro.cousub
(
  gid integer,
  statefp character varying(2),
  countyfp character varying(3),
  geoid character varying(10) NOT NULL,
  name character varying(100),
  aland numeric(14,0),
  awater numeric(14,0),
  intptlat character varying(11),
  intptlon character varying(12),
  geom geometry,
  CONSTRAINT pk_aro_cousub PRIMARY KEY (geoid)
)
WITH (
  OIDS=FALSE
);

CREATE INDEX aro_cousub_geom_gist
  ON aro.cousub
  USING gist
  (geom);

