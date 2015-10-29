-- Table: custom.route_edges

DROP TABLE IF EXISTS custom.route_edges;

CREATE TABLE custom.route_edges
(
  id SERIAL,
  route_id bigint REFERENCES custom.route ON DELETE CASCADE,
  edge_id bigint,
  CONSTRAINT custom_route_edges_pkey PRIMARY KEY (id)
);

CREATE INDEX custom_route_edges_route_index ON custom.route_edges(route_id);
