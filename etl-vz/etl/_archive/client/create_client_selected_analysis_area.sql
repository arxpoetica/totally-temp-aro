DROP TABLE IF EXISTS client.selected_analysis_area;
CREATE TABLE client.selected_analysis_area
(
  plan_id bigint NOT NULL REFERENCES client.plan ON DELETE CASCADE,
  analysis_area_id integer NOT NULL REFERENCES client.analysis_area ON DELETE CASCADE,
  CONSTRAINT client_selected_analysis_area_pkey PRIMARY KEY (plan_id, analysis_area_id)
);