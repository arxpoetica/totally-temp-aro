-- Table: custom.route_sources

CREATE TABLE custom.route_sources
(
  id SERIAL,
  splice_point_id bigint REFERENCES custom.splice_points,
  route_id bigint REFERENCES custom.route ON DELETE CASCADE,
  vertex_id bigint REFERENCES client.graph_vertices_pgr,
  CONSTRAINT custom_route_sources_pkey PRIMARY KEY (id)
);

CREATE INDEX custom_route_sources_route_index ON custom.route_sources(route_id);
