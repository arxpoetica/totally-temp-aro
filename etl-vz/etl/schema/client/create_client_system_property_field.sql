-- ----------------------------
--  Table structure for system_property_field
-- ----------------------------
DROP TABLE IF EXISTS "client"."system_property_field";
CREATE TABLE "client"."system_property_field" (
	"id" serial PRIMARY KEY,
	"name" varchar(128) COLLATE "default",
	"type" varchar(64) NOT NULL COLLATE "default",
	"description" varchar(512) COLLATE "default",
	UNIQUE (name)
) ;


INSERT INTO client.system_property_field (name, type, description)
	VALUES ('max_feeder_fiber_length_meters', 'Double', 'Max Feeder Fiber Length') ;

INSERT INTO client.system_property_field (name, type, description)
	VALUES ('max_distribution_fiber_length_meters', 'Double', 'Max Distribution Fiber Length') ;