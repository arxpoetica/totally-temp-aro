
DROP TABLE IF EXISTS client.plan;

CREATE TABLE client.plan
(
  id bigserial,
  --oid varchar NOT NULL,
  name varchar NOT NULL,
  plan_type int4 NOT NULL,
  parent_plan_id int8 NOT NULL REFERENCES client.plan ON DELETE CASCADE,

  --parent_version_id REFERENCES client.plan ON DELETE CASCADE,
  --source_plan int8,

  wirecenter_id int4,

  area_name varchar,
  area_centroid geometry,
  area_bounds geometry,

  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  CONSTRAINT client_plan_pkey PRIMARY KEY (id)
);

