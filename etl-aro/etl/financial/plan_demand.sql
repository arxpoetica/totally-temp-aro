DROP TABLE IF EXISTS financial.plan_demand CASCADE ;
CREATE TABLE financial.plan_demand (
	
	id bigserial PRIMARY KEY,

	network_report_id int8 not null references financial.network_report on delete cascade ,
	
	selected_locations double precision not null,
	revenue_total double precision not null,
	revenue_share  double precision not null,
	market_penetration  double precision not null	
)