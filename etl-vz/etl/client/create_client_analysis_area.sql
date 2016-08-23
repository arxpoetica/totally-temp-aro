DROP TABLE IF EXISTS client.analysis_area;
CREATE TABLE client.analysis_area
(	
id serial PRIMARY KEY,
analysis_layer_id int4 not null references client.analysis_layer, 
source_id varchar(64),
state varchar(6),
code varchar(64),
geog geography('MULTIPOLYGON', 4326)
);

SELECT AddGeometryColumn('client', 'analysis_area', 'geom', 4326, 'MULTIPOLYGON', 2);
SELECT AddGeometryColumn('client', 'analysis_area', 'edge_buffer', 4326, 'GEOMETRY', 2);
SELECT AddGeometryColumn('client', 'analysis_area', 'location_edge_buffer', 4326, 'GEOMETRY', 2);


CREATE INDEX client_analysis_area_geom_gist ON client.analysis_area USING gist (geom);
CREATE INDEX client_analysis_area_geog_gist ON client.analysis_area USING gist (geog);
CREATE INDEX client_analysis_area_edge_buffer ON client.analysis_area USING gist (edge_buffer);
CREATE INDEX client_analysis_area_location_edge_buffer ON client.analysis_area USING gist (location_edge_buffer) ;