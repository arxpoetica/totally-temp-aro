DROP TABLE IF EXISTS "client"."analysis_layer";
create table client.analysis_layer (
id serial,
"name" varchar(32) UNIQUE,
"description" varchar(256),
is_user_defined boolean,
PRIMARY KEY(id)
)
WITH (OIDS=FALSE);
ALTER TABLE "client"."analysis_layer" OWNER TO "aro";

-- Basic Report Types

insert into client.analysis_layer (name, description, is_user_defined) 
     values('cma', 'CMA', false) ;