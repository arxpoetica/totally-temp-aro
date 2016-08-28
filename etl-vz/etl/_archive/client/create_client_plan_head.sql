DROP TABLE IF EXISTS client.plan_head;
CREATE TABLE client.plan_head
(
  id SERIAL PRIMARY KEY,
  created_on timestamp NOT NULL,
  updated_on timestamp NOT NULL,
  plan_id int8 REFERENCES client.plan ON DELETE CASCADE,
  service_area_id int4 REFERENCES client.service_area ON DELETE CASCADE,
  UNIQUE (plan_id, service_area_id)
);


CREATE INDEX client_plan_head_plan_index ON client.plan_head(plan_id);
CREATE INDEX client_plan_head_service_area_index ON client.plan_head(service_area_id);