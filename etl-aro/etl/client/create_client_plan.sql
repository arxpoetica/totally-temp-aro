
DROP TABLE IF EXISTS client.plan;

CREATE TABLE client.plan
(
  id bigserial,
  name character varying NOT NULL,
  plan_type character varying NOT NULL,
  parent_plan_id int8 REFERENCES client.plan ON DELETE CASCADE,
  wirecenter_id int4,
  area_name character varying,
  area_centroid geometry,
  area_bounds geometry,
  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,

  "total_cost" float8,
  "total_revenue" float8,
  "household_revenue" float8,
  "celltower_revenue" float8,
  "business_revenue" float8,
  "fiber_cost" float8,
  "equipment_cost" float8,
  "co_cost" float8,
  "fdh_cost" float8,
  "fdt_cost" float8,
  "total_count" float8,
  "npv" float8,

  CONSTRAINT client_plan_pkey PRIMARY KEY (id)
);

