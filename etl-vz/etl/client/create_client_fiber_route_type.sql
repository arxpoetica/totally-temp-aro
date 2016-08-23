
-- ----------------------------
--  Table structure for fiber_route_type
-- ----------------------------
DROP TABLE IF EXISTS "client"."fiber_route_type";
CREATE TABLE "client"."fiber_route_type" (
	"id" serial,
	"name" varchar(256) COLLATE "default",
	"description" varchar(256) COLLATE "default",
	CONSTRAINT client_fiber_route_type_pkey PRIMARY KEY (id)
) ;
ALTER TABLE "client"."fiber_route_type" OWNER TO "aro";

insert into client.fiber_route_type (name, description) values ('unknown', 'Unknown Fiber') ;
insert into client.fiber_route_type (name, description) values ('backbone', 'Back Bone Fiber') ;
insert into client.fiber_route_type (name, description) values ('feeder', 'Feeder Fiber') ;
insert into client.fiber_route_type (name, description) values ('distribution', 'Distribution Fiber') ;
insert into client.fiber_route_type (name, description) values ('drop', 'Drop Cable') ;


