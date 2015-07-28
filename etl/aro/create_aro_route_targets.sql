-- Table: aro.route_targets

CREATE TABLE aro.route_targets
(
  id SERIAL,
  location_id bigint REFERENCES aro.locations,
  route_id bigint REFERENCES aro.route ON DELETE CASCADE,
  vertex_id bigint REFERENCES client.graph_vertices_pgr,
  CONSTRAINT aro_route_targets_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_route_targets_route_index ON aro.route_targets(route_id);
