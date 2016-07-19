-- NETWORK_COST_CODE Primary Code Used BY ARO to identify network cost elements

DROP TABLE IF EXISTS "financial"."network_cost_code";
CREATE TABLE "financial"."network_cost_code" (
	"id" serial primary key,
	"name" varchar(32) UNIQUE,
	"description" varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."network_cost_code" OWNER TO "aro";

insert into financial.network_cost_code (name, description) 
	values ('central_office','Central Office equipment') ;

insert into financial.network_cost_code (name, description) 
	values ('fiber_distribution_hub','Fiber Deployment Hub Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('bulk_distribution_hub','Bulk Distribution Hub Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('fiber_distribution_terminal','Fiber Deployment Terminal Installation') ;


insert into financial.network_cost_code (name, description) 
	values ('splice_point','Splice Point') ;

insert into financial.network_cost_code (name, description) 
	values ('feeder_fiber','Feeder Fiber Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('distribution_fiber','Distibution Fiber Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('backbone_fiber','Distibution Fiber Installation') ;

