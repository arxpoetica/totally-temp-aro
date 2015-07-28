-- Table: aro.route_sources

CREATE TABLE aro.route_sources
(
  id SERIAL,
  splice_point_id bigint REFERENCES aro.splice_points,
  route_id bigint REFERENCES aro.route ON DELETE CASCADE,
  vertex_id bigint REFERENCES client.graph_vertices_pgr,
  CONSTRAINT aro_route_sources_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_route_sources_route_index ON aro.route_sources(route_id);
