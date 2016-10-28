DROP TABLE IF EXISTS client.network_plan_data;
CREATE TABLE client.network_plan_data
(
 network_plan_id bigint references client.plan(id) on delete cascade, 
 data_key character varying NOT NULL,
 geom geometry,
 data_field character varying,
 PRIMARY KEY(network_plan_id, data_key)
);