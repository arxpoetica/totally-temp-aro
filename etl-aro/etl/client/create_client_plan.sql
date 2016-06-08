
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
  total_revenue double precision,
  household_revenue double precision,
  celltower_revenue double precision,
  business_revenue double precision,
  total_cost double precision,
  fiber_cost double precision,
  equipment_cost double precision,
  co_cost double precision,
  fdh_cost double precision,
  fdt_cost double precision,
  total_count double precision,
  npv double precision,
  CONSTRAINT client_plan_pkey PRIMARY KEY (id)
);

