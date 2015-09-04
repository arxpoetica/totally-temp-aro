-- Table: custom.route

DROP TABLE IF EXISTS custom.route;

CREATE TABLE custom.route
(
  id SERIAL,
  name varchar NOT NULL,
  area_name varchar,
  area_centroid geometry,
  area_bounds geom,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  CONSTRAINT custom_route_pkey PRIMARY KEY (id)
);

-- Add reference to route in client.network_nodes
ALTER TABLE client.network_nodes ADD COLUMN route_id bigint REFERENCES custom.route ON DELETE CASCADE;

CREATE INDEX client_network_nodes_route_index ON client.network_nodes(route_id);
