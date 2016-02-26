-- Table: custom.route_sources

DROP TABLE IF EXISTS custom.route_sources;

CREATE TABLE custom.route_sources
(
  id SERIAL,
  network_node_id bigint REFERENCES client.network_nodes,
  route_id bigint REFERENCES custom.route ON DELETE CASCADE,
  CONSTRAINT custom_route_sources_pkey PRIMARY KEY (id)
);

CREATE INDEX custom_route_sources_route_index ON custom.route_sources(route_id);
