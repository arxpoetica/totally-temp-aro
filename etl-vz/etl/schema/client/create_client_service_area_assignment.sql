DROP TABLE IF EXISTS client.service_area_assignment ;
CREATE TABLE client.service_area_assignment (
	service_layer_id int4  REFERENCES client.service_layer,
	service_area_id int4  REFERENCES client.service_area,
	analysis_area_id int4 REFERENCES client.service_area,
	area_m2 numeric,
	is_primary boolean,
	
	CONSTRAINT service_area_assignment_pk PRIMARY KEY(service_layer_id, service_area_id, analysis_area_id)
) ;

SELECT AddGeometryColumn('client', 'service_area_assignment', 'geom', 4326, 'GEOMETRY', 2);

CREATE INDEX client_service_area_assignment_geom ON client.service_area_assignment USING gist (geom);
CREATE INDEX client_service_area_assignment_is_primary ON client.service_area_assignment (is_primary);

