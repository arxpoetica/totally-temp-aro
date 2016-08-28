
DROP TABLE IF EXISTS "financial"."equipment_summary_cost" cascade ;
create table financial.equipment_summary_cost (
	
	
	network_cost_code_id int4 references financial.network_cost_code,
	network_report_id int8 not null references financial.network_report on delete cascade ,
		
	atomic_count double precision,
	quantity double precision,
	price double precision,
	total_cost double precision,

	PRIMARY KEY (network_cost_code_id, network_report_id)

)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."equipment_summary_cost" OWNER TO "aro";


