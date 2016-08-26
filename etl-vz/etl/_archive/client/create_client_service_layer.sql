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
    VALUES('wirecenter', 'Wirecenter Layer', false) ;

INSERT INTO client.service_layer (name, description, is_user_defined) 
    VALUES('cran', 'Cran Layer', false) ;

INSERT INTO client.service_layer (name, description, is_user_defined) 
	VALUES('directional_facility', 'Directional Facility', false) ;

