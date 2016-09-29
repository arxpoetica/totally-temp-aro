DROP TABLE IF EXISTS "client"."service_layer";
create table client.service_layer (
	id serial,
	"name" varchar(32) UNIQUE,
	"description" varchar(256),
	is_user_defined boolean,
	PRIMARY KEY(id)
)
WITH (OIDS=FALSE);
ALTER TABLE "client"."service_layer" OWNER TO "aro";

-- Basic Report Types

insert into client.service_layer (name, description, is_user_defined) 
	values('wirecenter', 'Wirecenter Layer', false) ;

insert into client.service_layer (name, description, is_user_defined) 
	values('cran', 'Cran Layer', false) ;