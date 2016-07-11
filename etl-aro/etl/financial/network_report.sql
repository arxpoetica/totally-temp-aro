-- Report Header

DROP TABLE IF EXISTS "financial"."network_report" cascade ;
create table financial.network_report (
	
	id bigserial primary key,
	code varchar(4) not null references financial.report_type,
	
	plan_id int8 not null references client.plan on delete cascade,
	
	state_code varchar(16),
	pricing_date date
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."network_report" OWNER TO "aro";
