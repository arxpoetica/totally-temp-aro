-- Mapping from network to network_cost_code

DROP TABLE IF EXISTS "financial"."network_cost_code_node_type";
CREATE TABLE "financial"."network_cost_code_node_type" (
	network_code_id int4 references financial.network_cost_code, 
	network_node_type_id int4 references client.network_node_types,
	primary key (network_code_id, network_node_type_id)
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."network_cost_code_node_type" OWNER TO "aro";

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'central_office'), 
			(select id from client.network_node_types where name = 'central_office')) ;

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'splice_point'), 
			(select id from client.network_node_types where name = 'splice_point')) ;

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'fiber_distribution_hub'), 
			(select id from client.network_node_types where name = 'fiber_distribution_hub')) ;

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'fiber_distribution_terminal'), 
			(select id from client.network_node_types where name = 'fiber_distribution_terminal')) ;


insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'bulk_distribution_hub'), 
			(select id from client.network_node_types where name = 'bulk_distrubution_terminal')) ;

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'fiber_distribution_terminal'), 
			(select id from client.network_node_types where name = 'bulk_distribution_consumer')) ;

