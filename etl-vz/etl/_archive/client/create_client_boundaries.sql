-- Table: client.boundaries

DROP TABLE IF EXISTS client.boundaries;

CREATE TABLE client.boundaries
(
  id bigserial,
  plan_id bigint NOT NULL REFERENCES client.plan ON DELETE CASCADE,
  name varchar not null,
  geom geometry
);
