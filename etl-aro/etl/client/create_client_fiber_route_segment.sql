-- ------------------------------------------
--  Table structure for fiber_route_segment
-- ------------------------------------------
DROP TABLE IF EXISTS "client"."fiber_route_segment";
CREATE TABLE "client"."fiber_route_segment" (
	"id" bigserial,
	"fiber_route_id" int8 REFERENCES client.fiber_route ON DELETE CASCADE,
	"cable_construction_type_id" int4 REFERENCES client.cable_construction_type ,
	"geom" "public"."geometry",
	CONSTRAINT client_fiber_route_segment_pkey PRIMARY KEY (id)
);
ALTER TABLE "client"."fiber_route_segment" OWNER TO "aro";

CREATE INDEX client_fiber_route_segment_geom_gist
  ON client.fiber_route_segment
  USING gist
  (geom);

 CREATE INDEX client_network_fiber_segment_route_index ON client.fiber_route_segment(fiber_route_id);

