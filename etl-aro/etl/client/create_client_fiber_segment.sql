-- ----------------------------
--  Table structure for fiber_plant
-- ----------------------------
DROP TABLE IF EXISTS "client"."fiber_segment";
CREATE TABLE "client"."fiber_segment" (
	"id" bigserial,
	"fiber_route_id"  int8 REFERENCES client.fiber_route ON DELETE CASCADE,
	"the_geom" "public"."geometry",
	"name" varchar(256) COLLATE "default",
	CONSTRAINT client_fiber_segment PRIMARY KEY (id)
)
WITH (OIDS=FALSE);
ALTER TABLE "client"."fiber_segment" OWNER TO "aro";
