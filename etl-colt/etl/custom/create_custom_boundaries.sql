-- Table: custom.boundaries

DROP TABLE IF EXISTS custom.boundaries;

CREATE TABLE custom.boundaries
(
  id serial,
  route_id bigint NOT NULL REFERENCES custom.route ON DELETE CASCADE,
  name varchar not null,
  geom geometry
);
