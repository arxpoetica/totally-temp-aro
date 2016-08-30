-- Table: client.plan_boundaries

DROP TABLE IF EXISTS client.plan_boundaries;

CREATE TABLE client.plan_boundaries
(
  id serial,
  plan_id bigint NOT NULL REFERENCES client.plan ON DELETE CASCADE,
  name varchar not null,
  geom geometry
);
