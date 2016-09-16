DROP TABLE IF EXISTS cache.service_area_versions;

CREATE TABLE cache.service_area_versions
(
  service_area_id serial NOT NULL,
  deployment_plan_id bigint NOT NULL,
  service_area_version bigint,
  last_updated timestamp without time zone,
  optlock integer DEFAULT 0
)
WITH (
  OIDS=FALSE
);
