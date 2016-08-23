-- Table: client.selected_regions

DROP TABLE IF EXISTS client.selected_regions;

CREATE TABLE client.selected_regions
(
  id bigserial,
  plan_id bigint NOT NULL REFERENCES client.plan ON DELETE CASCADE,
  region_name varchar not null,
  region_id bigint not null,
  region_type varchar not null,
  geom geometry
);
