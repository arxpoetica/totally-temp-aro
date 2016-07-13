DROP TABLE IF EXISTS financial.plan_demand CASCADE ;
CREATE TABLE financial.plan_demand (
	
	id bigserial PRIMARY KEY,

	network_report_id int8 not null references financial.network_report on delete cascade ,
	
	--speed_type int4  not null references client.speed_type,
	--product_type int4 not null references client.product_type,
	--demand_type int4 not null references client.demand_type

	-- Disable references until fully reloaded in all environments
	speed_type int4  not null references client.speed_type,
	product_type int4 not null references client.product_type,
	demand_type int4 not null references client.demand_type

)