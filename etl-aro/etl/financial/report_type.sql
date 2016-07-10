DROP TABLE IF EXISTS "financial"."report_type";
create table financial.report_type (
	"id" serial PRIMARY KEY,
	"name" varchar(32) UNIQUE,
	"description" varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."report_type" OWNER TO "aro";

insert into financial.report_type (name, description) 
	values('detail_equipment','Detail Equipment Report') ;

insert into financial.report_type (name, description) 
	values('summary_equipment','Summary Equipment Report') ;

insert into financial.report_type (name, description) 
	values('detail_fiber','Detail Fiber Report') ;

insert into financial.report_type (name, description) 
	values('summary_fiber','Summary Fiber Report') ;

insert into financial.report_type (name, description) 
	values('plan_summary','Wirecenter Report') ;
	
