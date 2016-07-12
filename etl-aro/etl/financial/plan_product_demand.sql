DROP TABLE IF EXISTS financial.plan_product_demand CASCADE ;
CREATE TABLE financial.plan_product_demand (
	
	id bigserial PRIMARY KEY,

	plan_demand_id int8 not null references financial.plan_demand on delete cascade ,
	product_type int4 not null references client.product_type,
	
	market_share double precision not null,

	selected_total_revenue  double precision not null,
	selected_fiber_count  double precision not null,
	
	plan_total_revenue  double precision not null,
	plan_share_revenue double precision not null,
	plan_fiber_count double precision not null,

	market_penetration double precision not null,
	product_penetration double precision not null,

	UNIQUE (plan_demand_id, product_type)
	
)
