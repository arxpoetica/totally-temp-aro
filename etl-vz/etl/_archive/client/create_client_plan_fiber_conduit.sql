-- ----------------------------
--  Table structure for plan_fiber_conduit
-- ----------------------------
DROP TABLE IF EXISTS "client"."plan_fiber_conduit";
CREATE TABLE "client"."plan_fiber_conduit" (
	"id" bigserial,
	"plan_id" int8 REFERENCES client.plan ON DELETE CASCADE,
	"geom" "public"."geometry",
	CONSTRAINT client_plan_fiber_conduit_pkey PRIMARY KEY (id)
);
ALTER TABLE "client"."plan_fiber_conduit" OWNER TO "aro";

CREATE INDEX client_plan_fiber_conduit_geom_gist
  ON client.plan_fiber_conduit
  USING gist
  (geom);

CREATE INDEX client_plan_fiber_conduit_index ON client.plan_fiber_conduit(plan_id);
  

