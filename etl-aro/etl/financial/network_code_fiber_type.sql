DROP TABLE IF EXISTS "financial"."network_code_fiber_type";
CREATE TABLE "financial"."network_code_fiber_type" (
	network_cost_code_id int4 references financial.network_cost_code, 
	fiber_route_type_id int4 references client.fiber_route_type,
	cable_construction_type_id int4 references client.cable_construction_type,
	primary key (network_cost_code_id,fiber_route_type_id, cable_construction_type_id) 
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."network_code_fiber_type" OWNER TO "aro";

-- (Feeder) ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTRACLE

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber'),
			(select id from client.fiber_route_type where name = 'feeder'),
			(select id from client.cable_construction_type where name = 'estimated')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_arial'),
			(select id from client.fiber_route_type where name = 'feeder'),
			(select id from client.cable_construction_type where name = 'arial')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_buried'),
			(select id from client.fiber_route_type where name = 'feeder'),
			(select id from client.cable_construction_type where name = 'buried')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_underground'),
			(select id from client.fiber_route_type where name = 'feeder'),
			(select id from client.cable_construction_type where name = 'underground')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_conduit'),
			(select id from client.fiber_route_type where name = 'feeder'),
			(select id from client.cable_construction_type where name = 'conduit')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_obstacle'),
			(select id from client.fiber_route_type where name = 'feeder'),
			(select id from client.cable_construction_type where name = 'obstacle')) ;

-- (Distribution) ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTRACLE

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber'),
			(select id from client.fiber_route_type where name = 'distribution'),
			(select id from client.cable_construction_type where name = 'estimated')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber_arial'),
			(select id from client.fiber_route_type where name = 'distribution'),
			(select id from client.cable_construction_type where name = 'arial')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber_buried'),
			(select id from client.fiber_route_type where name = 'distribution'),
			(select id from client.cable_construction_type where name = 'buried')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber_underground'),
			(select id from client.fiber_route_type where name = 'distribution'),
			(select id from client.cable_construction_type where name = 'underground')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber_conduit'),
			(select id from client.fiber_route_type where name = 'distribution'),
			(select id from client.cable_construction_type where name = 'conduit')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_obstacle'),
			(select id from client.fiber_route_type where name = 'feeder'),
			(select id from client.cable_construction_type where name = 'obstacle')) ;


-- (Backbone ie Backhaul) ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTRACLE

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber'),
			(select id from client.fiber_route_type where name = 'backbone'),
			(select id from client.cable_construction_type where name = 'estimated')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_arial'),
			(select id from client.fiber_route_type where name = 'backbone'),
			(select id from client.cable_construction_type where name = 'arial')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_buried'),
			(select id from client.fiber_route_type where name = 'backbone'),
			(select id from client.cable_construction_type where name = 'buried')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_underground'),
			(select id from client.fiber_route_type where name = 'backbone'),
			(select id from client.cable_construction_type where name = 'underground')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_conduit'),
			(select id from client.fiber_route_type where name = 'backbone'),
			(select id from client.cable_construction_type where name = 'conduit')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id, cable_construction_type_id)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_obstacle'),
			(select id from client.fiber_route_type where name = 'backbone'),
			(select id from client.cable_construction_type where name = 'obstacle')) ;


