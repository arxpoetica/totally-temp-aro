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

----Fiber ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTRACLE

insert into financial.network_cost_code (name, description) 
	values ('feeder_fiber','Feeder Fiber Default Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('feeder_fiber_ariel','Feeder Fiber Arial Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('feeder_fiber_buried','Feeder Fiber Buried Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('feeder_fiber_underground','Feeder Fiber Underground Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('feeder_fiber_conduit','Feeder Fiber Conduit Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('feeder_fiber_obstacle','Feeder Fiber Obstacle Installation') ;

----Fiber ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTRACLE

insert into financial.network_cost_code (name, description) 
	values ('distribution_fiber','Distibution Fiber Default Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('distribution_fiber_ariel','Distibution Fiber Arial Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('distribution_fiber_buried','Distibution Fiber Buried Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('distribution_fiber_underground','Distibution Fiber Underground Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('distribution_fiber_conduit','Distibution Fiber Conduit Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('distribution_fiber_obstacle','Distibution Fiber Obstacle Installation') ;


----Fiber ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTRACLE

insert into financial.network_cost_code (name, description) 
	values ('backbone_fiber','Backhaul Fiber Default Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('backbone_fiber_ariel','Backhaul Fiber Arial Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('backbone_fiber_buried','Backhaul Fiber Buried Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('backbone_fiber_underground','Backhaul Fiber Underground Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('backbone_fiber_conduit','Backhaul Fiber Conduit Installation') ;

insert into financial.network_cost_code (name, description) 
	values ('backbone_fiber_obstacle','Backhaul Fiber Obstacle Installation') ;


