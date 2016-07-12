DROP TABLE IF EXISTS "financial"."plan_demand" cascade ;
create table financial.plan_demand (
	
	network_report_id int8 not null references financial.network_report on delete cascade ,
	entity_type int4 not null references client.entity_category,
	product_type int4 not null references client.product_type,

	selected_total_fibercount double precision not null,
	selected_total_premises double precision not null,
	selected_total_revenue double precision not null,
	
	plan_total_fibercount double precision not null,
	plan_total_premises double precision not null,
	plan_total_revenue  double precision not null,
	
	plan_share_revenue double precision not null,
	plan_share_premises double precision not null,
	penetration double precision not null,

	PRIMARY KEY(network_report_id, entity_type)
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."plan_demand" OWNER TO "aro";