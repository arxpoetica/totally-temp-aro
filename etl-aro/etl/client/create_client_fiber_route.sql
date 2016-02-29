-- ----------------------------
--  Table structure for fiber_route
-- ----------------------------
DROP TABLE IF EXISTS "client"."fiber_route";
CREATE TABLE "client"."fiber_route" (
	"id" bigserial,
	"plan_id" int8 REFERENCES client.plan ON DELETE CASCADE,
	"fiber_route_type" int4 REFERENCES client.fiber_route_type ,
	"parent_node_id" int8 REFERENCES client.network_nodes ON DELETE CASCADE,
	"from_node_id" int8 REFERENCES client.network_nodes ON DELETE CASCADE,
	"to_node_id" int8 REFERENCES client.network_nodes ON DELETE CASCADE,
	"name" varchar(256) COLLATE "default",
	"clli" varchar(64),
	"geom" "public"."geometry",
	CONSTRAINT client_fiber_route_pkey PRIMARY KEY (id)
);
ALTER TABLE "client"."fiber_route" OWNER TO "aro";

CREATE INDEX client_fiber_route_geom_gist
  ON client.fiber_route
  USING gist
  (geom);

  CREATE INDEX client_network_fiber_route_index ON client.fiber_route(plan_id);
  CREATE INDEX client_network_parent_node_index ON client.fiber_route(parent_node_id);

