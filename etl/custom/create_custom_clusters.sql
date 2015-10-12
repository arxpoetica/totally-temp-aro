-- Table: custom.clusters

DROP TABLE IF EXISTS custom.clusters;

CREATE TABLE custom.clusters (
  geom geometry,
  density integer,
  name varchar,
  zoom integer
);

CREATE INDEX custom_clusters_name_index ON custom.clusters(name);
