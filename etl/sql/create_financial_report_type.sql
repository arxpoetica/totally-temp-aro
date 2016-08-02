DROP TABLE IF EXISTS "financial"."report_type";
create table financial.report_type (
	"code" char(1),
	"name" varchar(32) UNIQUE,
	"description" varchar(256),
	PRIMARY KEY(code)
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."report_type" OWNER TO "aro";

-- Basic Report Types

insert into financial.report_type (code, name, description) 
	values('P', 'plan_summary', 'Plan Summary Report') ;

insert into financial.report_type (code, name, description) 
	values('D', 'equipment_detail', 'Equipment Detail Report') ;

insert into financial.report_type (code, name, description) 
	values('S', 'equipment_summary', 'Equipment Summary Report') ;



	
