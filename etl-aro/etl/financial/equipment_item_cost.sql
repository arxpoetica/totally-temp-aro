DROP TABLE IF EXISTS "financial"."equipment_item_cost" cascade ;
create table financial.equipment_item_cost (
	
	id bigserial primary key,
	
	network_cost_code_id int4 references financial.network_cost_code,
	network_report_id int8 not null references financial.network_report on delete cascade ,
	network_node_id int8 not null references client.network_nodes on delete cascade,
		
	atomic_count double precision,
	quantity double precision,
	price double precision,
	total_cost double precision
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."equipment_item_cost" OWNER TO "aro";