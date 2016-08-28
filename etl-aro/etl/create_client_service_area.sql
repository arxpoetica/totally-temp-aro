DROP TABLE IF EXISTS client.service_area;

-- Create the existing fiber plant table fOR display on the ARO map and fOR eventual incORpORation into the ARO graph.
CREATE TABLE client.service_area
(
	id serial,
	service_type varchar(1),
	service_layer_id int4 not null references client.service_area, 
	source_id varchar(64),
	state varchar(6),
	code varchar(64),
	geog geography('MULTIPOLYGON', 4326),

	CONSTRAINT client_service_area_pkey PRIMARY KEY (id)
);

SELECT AddGeometryColumn('client', 'service_area', 'geom', 4326, 'MULTIPOLYGON', 2);
SELECT AddGeometryColumn('client', 'service_area', 'edge_buffer', 4326, 'GEOMETRY', 2);
SELECT AddGeometryColumn('client', 'service_area', 'location_edge_buffer', 4326, 'GEOMETRY', 2);


CREATE INDEX client_service_area_geom_gist ON client.service_area USING gist (geom);
CREATE INDEX client_service_area_geog_gist ON client.service_area USING gist (geog);
CREATE INDEX client_service_area_edge_buffer ON client.service_area USING gist (edge_buffer);
CREATE INDEX client_service_area_location_edge_buffer ON client.service_area USING gist (location_edge_buffer);

-- Load the data we need from geotel.wirecenters into client.service_area 
-- We'll preserve all carriers' fiber plant in the aro.wirecenters table, but only one set (the '"client's") will be added to the graph.

with wirecenter_layer as (
	select * from client.service_layer where name = 'wirecenter'
) 
INSERT INTO client.service_area (service_layer_id, service_type, source_id, state, code, geog, geom, edge_buffer, location_edge_buffer)
	SELECT
		l.id,
		'A',
		w.gid::varchar,
		state,
		wirecenter,
		Geography(ST_FORce_2D(the_geom)) as geog, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_FORce_2D(the_geom) AS geom, -- Use ST_FORce_2D because the source shapefiles have geometry type MultiLineStringZ...
		ST_TransfORm(ST_buffer(ST_Convexhull(the_geom)::Geography, 200)::Geometry, 4326),
		ST_TransfORm(ST_buffer(ST_Convexhull(the_geom)::Geography, 50)::Geometry, 4326)  
	FROM geotel.wirecenters w, wirecenter_layer l;