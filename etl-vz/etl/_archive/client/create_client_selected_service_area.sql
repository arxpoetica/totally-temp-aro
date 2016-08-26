DROP TABLE IF EXISTS client.selected_service_area;
CREATE TABLE client.selected_service_area
(
  plan_id bigint NOT NULL REFERENCES client.plan ON DELETE CASCADE,
  service_area_id integer NOT NULL REFERENCES client.service_area ON DELETE CASCADE,
  CONSTRAINT client_selected_service_area_pkey PRIMARY KEY (plan_id, service_area_id)
);