-- Table: client.plan_targets

DROP TABLE IF EXISTS client.plan_targets;

CREATE TABLE client.plan_targets
(
  id SERIAL,
  location_id bigint REFERENCES aro.locations,
  route_id bigint REFERENCES client.plan ON DELETE CASCADE,
  CONSTRAINT client_plan_targets_pkey PRIMARY KEY (id)
);

CREATE INDEX client_plan_targets_route_index ON client.plan_targets(route_id);
