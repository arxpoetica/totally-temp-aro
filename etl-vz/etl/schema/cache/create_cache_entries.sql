DROP TABLE IF EXISTS cache.cache_entries;

CREATE TABLE cache.cache_entries
(
  service_area_id integer NOT NULL,
  deployment_plan_id bigint NOT NULL,
  cache_type character varying NOT NULL,
  deployment_version bigint,
  location_version bigint,
  last_updated timestamp(6) without time zone,
  optlock bigint DEFAULT 0,
  cache_data bytea,
  length bigint NOT NULL DEFAULT 0,
  service_area_version bigint,
  CONSTRAINT cache_entries_pkey PRIMARY KEY (service_area_id, deployment_plan_id, cache_type)
);
