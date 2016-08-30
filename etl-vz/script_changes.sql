-- Table: client.route

DROP TABLE IF EXISTS client.plan;

CREATE TABLE client.plan
(
  id bigserial,
  --oid varchar NOT NULL,
  name varchar NOT NULL,
  plan_type int4 NOT NULL,
  --parent_version_id int8,
  --source_plan int8,

  wirecenter_id int4,

  area_name varchar,
  area_centroid geometry,
  area_bounds geometry,

  created_at timestamp NOT NULL,
  updated_at timestamp NOT NULL,
  CONSTRAINT client_plan_pkey PRIMARY KEY (id)
);

-- Add reference to route in client.network_nodes
ALTER TABLE client.network_nodes ADD COLUMN plan_id bigint REFERENCES client.plan ON DELETE CASCADE;
CREATE INDEX client_network_nodes_route_index ON client.network_nodes(plan_id);


-- Table: client.route_targets

DROP TABLE IF EXISTS client.plan_targets;

CREATE TABLE client.plan_targets
(
  id SERIAL,
  location_id bigint REFERENCES aro.locations,
  route_id bigint REFERENCES client.plan ON DELETE CASCADE,
  CONSTRAINT client_plan_targets_pkey PRIMARY KEY (id)
);

CREATE INDEX client_plan_targets_route_index ON client.plan_targets(route_id);


-- Table: client.route_sources

DROP TABLE IF EXISTS client.plan_sources;

CREATE TABLE client.plan_sources
(
  id bigserial,
  network_node_id bigint REFERENCES client.network_nodes,
  plan_id bigint REFERENCES client.plan ON DELETE CASCADE,
  CONSTRAINT client_plan_sources_pkey PRIMARY KEY (id)
);

CREATE INDEX client_plan_sources_route_index ON client.plan_sources(route_id);


DROP TABLE IF EXISTS client.boundaries;

CREATE TABLE client.boundaries
(
  id serial,
  plan_id bigint NOT NULL REFERENCES client.plan ON DELETE CASCADE,
  name varchar not null,
  geom geometry
);


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
	CONSTRAINT client_fiber_route_pkey PRIMARY KEY (id)
);
ALTER TABLE "client"."fiber_route" OWNER TO "aro";

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


