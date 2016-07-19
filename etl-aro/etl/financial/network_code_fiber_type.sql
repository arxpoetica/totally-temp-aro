DROP TABLE IF EXISTS "financial"."network_code_fiber_type";
CREATE TABLE "financial"."network_code_fiber_type" (
	network_cost_code_id int4 references financial.network_cost_code, 
	fiber_route_type_id int4 references client.fiber_route_type,
	primary key (network_cost_code_id,fiber_route_type_id) 
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."network_code_fiber_type" OWNER TO "aro";

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber'),
			(select id from client.fiber_route_type where name = 'feeder')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber'),
			(select id from client.fiber_route_type where name = 'distribution')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber'),
			(select id from client.fiber_route_type where name = 'backbone')) ;

