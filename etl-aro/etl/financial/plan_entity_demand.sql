
DROP TABLE IF EXISTS financial.plan_entity_demand cascade ;
create table financial.plan_entity_demand (
	
	id bigserial PRIMARY KEY,

	plan_product_demand_id int8 not null references financial.plan_product_demand on delete cascade ,
	entity_type int4 not null references client.entity_category,
	
	selected_premises double precision not null,
	selected_fiber_count double precision not null,
	selected_revenue_total double precision not null,
	
	plan_premises double precision not null,
	plan_fiber_count double precision not null,
	plan_revenue_total  double precision not null,
	plan_revenue_share double precision not null,
	
	market_penetration double precision not null,
	product_penetration double precision not null,
	
	share_premises double precision not null,
	
	UNIQUE(plan_product_demand_id, entity_type)
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."plan_entity_demand" OWNER TO "aro";