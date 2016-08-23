
DROP TABLE IF EXISTS "financial"."fiber_item_cost";
create table financial.fiber_item_cost (
	
	
	network_cost_code_id int4 references financial.network_cost_code,
	network_report_id int8 not null references financial.network_report on delete cascade,
	
	fiber_route_id int8 not null references client.fiber_route on delete cascade,
	
	length_meters double precision,
	cost_per_meter double precision,
	total_cost double precision,

	PRIMARY KEY (network_cost_code_id, network_report_id)
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."fiber_item_cost" OWNER TO "aro";