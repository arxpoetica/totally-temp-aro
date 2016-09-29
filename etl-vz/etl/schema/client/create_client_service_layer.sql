DROP TABLE IF EXISTS "client"."service_layer";

CREATE TABLE client.service_layer (
id serial,
"name" varchar(32) UNIQUE,
"description" varchar(256),
is_user_defined boolean,
CONSTRAINT client_service_layer_pkey PRIMARY KEY (id)
)
WITH (OIDS=FALSE);
ALTER TABLE "client"."service_layer" OWNER TO "aro";

-- Basic Report Types

INSERT INTO client.service_layer (name, description, is_user_defined)
VALUES('wirecenter', 'Wirecenter', false) ;

INSERT INTO client.service_layer (name, description, is_user_defined)
VALUES('cran', 'CRAN Polygon', false) ;

INSERT INTO client.service_layer (name, description, is_user_defined)
VALUES('directional_facility', 'VZB', false) ;

ALTER TABLE client.service_layer ADD COLUMN show_in_boundaries BOOL NOT NULL DEFAULT TRUE;

UPDATE client.service_layer SET show_in_boundaries=FALSE WHERE name='wirecenter';

UPDATE client.service_layer SET show_in_boundaries=FALSE WHERE name='directional_facility';

ALTER TABLE client.service_layer ADD COLUMN show_in_assets BOOL NOT NULL DEFAULT TRUE;

UPDATE client.service_layer SET show_in_assets=FALSE WHERE name='wirecenter';

UPDATE client.service_layer SET show_in_assets=FALSE WHERE name='directional_facility';

ALTER TABLE client.service_layer ADD COLUMN "equipment_description" varchar(256);

UPDATE client.service_layer SET equipment_description='VZT' WHERE name='wirecenter';

UPDATE client.service_layer SET equipment_description='VZB' WHERE name='directional_facility';

UPDATE client.service_layer SET equipment_description='VZW' WHERE name='cran';