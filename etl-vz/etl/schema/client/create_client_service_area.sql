DROP TABLE IF EXISTS client.service_area;

CREATE TABLE client.service_area
(
	id serial,
	service_type varchar(1),
	service_layer_id int4 not null references client.service_layer, 
	source_id varchar(64),
	data_source_id bigint references user_data.data_source(id) on delete cascade,
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
CREATE INDEX client_service_area_data_source_id ON client.service_area (data_source_id);
