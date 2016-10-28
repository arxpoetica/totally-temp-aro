DROP TABLE IF EXISTS client.network_plan_data;
CREATE TABLE client.network_plan_data
(
  id bigint  NOT NULL,
  key character varying NOT NULL,
  network_plan_id bigint references client.plan(id) on delete cascade, 
  geom geometry,
  data_field character varying,
  PRIMARY KEY(id, key)
);