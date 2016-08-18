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

INSERT INTO client.existing_fiber(source_fiber_segment_id, source_name, geom, edge_intersect_buffer_geom)
    SELECT
        gid,
        'Geotel',
        the_geom,
        st_multi(st_transform(st_buffer(geom::geography, 20)::geometry, 4326))
    FROM geotel.fiber

CREATE INDEX client_existing_fiber_geom
  ON client.existing_fiber
  USING gist
  (geom);

CREATE INDEX client_existing_fiber_edge_interset_buffer_geom
  ON client.existing_fiber
  USING gist
  (edge_intersect_buffer_geom);
