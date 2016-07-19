DROP TABLE IF EXISTS "financial"."line_item" cascade ;
create table financial.line_item (
	
	line_item_type int4 not null references financial.line_item_type on delete cascade ,
	network_report_id int8 not null references financial.network_report on delete cascade ,
	
	value double precision,

	PRIMARY KEY(line_item_type, network_report_id)
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."line_item" OWNER TO "aro";