DROP TABLE IF EXISTS client.existing_fiber CASCADE;

CREATE TABLE client.existing_fiber
(
	id serial,
	source_fiber_segment_id bigint,
	source_name varchar,
	CONSTRAINT client_existing_fiber_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('client', 'existing_fiber', 'geom', 4326, 'MULTILINESTRING', 2);
SELECT AddGeometryColumn('client', 'existing_fiber', 'edge_intersect_buffer_geom', 4326, 'MULTIPOLYGON', 2);

CREATE INDEX client_existing_fiber_geom
  ON client.existing_fiber
  USING gist
  (geom);

CREATE INDEX client_existing_fiber_edge_interset_buffer_geom
  ON client.existing_fiber
  USING gist
  (edge_intersect_buffer_geom);

