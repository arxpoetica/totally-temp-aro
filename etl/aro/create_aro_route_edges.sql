-- Table: aro.route_edges

CREATE TABLE aro.route_edges
(
  id SERIAL,
  route_id bigint REFERENCES aro.route ON DELETE CASCADE,
  edge_id bigint REFERENCES client.graph,
  CONSTRAINT aro_route_edges_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_route_edges_route_index ON aro.route_edges(route_id);
