-- Table: custom.route_targets

DROP TABLE IF EXISTS custom.route_targets;

CREATE TABLE custom.route_targets
(
  id SERIAL,
  location_id bigint REFERENCES aro.locations,
  route_id bigint REFERENCES custom.route ON DELETE CASCADE,
  vertex_id bigint REFERENCES client.graph_vertices_pgr,
  CONSTRAINT custom_route_targets_pkey PRIMARY KEY (id)
);

CREATE INDEX custom_route_targets_route_index ON custom.route_targets(route_id);
