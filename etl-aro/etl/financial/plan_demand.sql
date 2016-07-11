DROP TABLE IF EXISTS "financial"."plan_demand" cascade ;
create table financial.plan_demand (
	
	network_report_id int8 not null references financial.network_report on delete cascade ,
	entity_type int4 not null references client.entity_category,
	
	max_premises double precision not null,
	max_revenue double precision not null,

	plan_premises double precision not null,
	plan_revenue double precision not null,
	
	fair_share_demand double precision not null,
	penetration double precision not null,

	fiber_count double precision not null,
	
	PRIMARY KEY(network_report_id, entity_type)
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."plan_demand" OWNER TO "aro";