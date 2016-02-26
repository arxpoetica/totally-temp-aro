-- Table: client.plan_sources

DROP TABLE IF EXISTS client.plan_sources;

CREATE TABLE client.plan_sources
(
  id bigserial,
  network_node_id bigint REFERENCES client.network_nodes,
  plan_id bigint REFERENCES client.plan ON DELETE CASCADE,
  CONSTRAINT client_plan_sources_pkey PRIMARY KEY (id)
);

CREATE INDEX client_plan_sources_route_index ON client.plan_sources(plan_id);
