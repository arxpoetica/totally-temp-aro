-- Table: edges

DROP TABLE IF EXISTS aro.edges;

CREATE TABLE aro.edges
(
  gid integer NOT NULL,
  statefp character varying(2),
  countyfp character varying(3),
  edge_type text,
  edge_length double precision,
  geom geometry,
  geog geography,
  buffer geometry,
  CONSTRAINT pkey_aro_edges_gid PRIMARY KEY (gid)
)
WITH (
  OIDS=FALSE
);

CREATE INDEX idx_aro_edges_buffer
  ON aro.edges
  USING gist
  (buffer);

CREATE INDEX idx_aro_edges_geog_gist
  ON aro.edges
  USING gist
  (geog);

CREATE INDEX idx_aro_edges_geom_gist
  ON aro.edges
  USING gist
  (geom);

