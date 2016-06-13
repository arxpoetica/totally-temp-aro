
-- COST_CODE_TYPE (LABOR | MATERIAL)
DROP TABLE IF EXISTS financial.cost_code_type;
CREATE TABLE "financial"."cost_code_type" (
	"id" serial PRIMARY KEY,
	"name" varchar(32) UNIQUE,
	"description" varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."cost_code_type" OWNER TO "aro";

insert into financial.cost_code_type (name, description) values ('labor', 'Labor') ;
insert into financial.cost_code_type (name, description) values ('material', 'Material') ;

-- COST_CODE BOMs are defined by "cost codes"

DROP TABLE IF EXISTS "financial"."cost_code";
CREATE TABLE "financial"."cost_code" (
	"id" serial PRIMARY KEY,
	 cost_code_type_id int4 references financial.cost_code_type,
	"unit_of_measure_id" int4  not null references aro.uom,
	"name" varchar(64) UNIQUE,
	"description" varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."cost_code" OWNER TO "aro";

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
	(select id from financial.cost_code_type where name = 'material'),
	(select id from aro.uom where name = 'unit_cost')
	,'co_port', 'Central Office Port Equipment' ) ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
	(select id from financial.cost_code_type where name = 'labor'),
	(select id from aro.uom where name = 'unit_cost')
	,'install_co_port', 'Install Central Office Port' ) ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_cost')
	, 'fdh_equipment', 'FDH Equipment') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'labor'),
		(select id from aro.uom where name = 'unit_per_hour')
	, 'install_fdh_equipment', 'Install FDH') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
	(select id from financial.cost_code_type where name = 'material'),
	(select id from aro.uom where name = 'unit_cost')
	, 'optical_splitter_32', '32 Port Optical Splitter' ) ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
	(select id from financial.cost_code_type where name = 'material'),
	(select id from aro.uom where name = 'unit_cost')
	, 'fdt_equipment', 'FDT Equipment') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'labor'),
		(select id from aro.uom where name = 'unit_per_hour')
	, 'install_fdt_equipment', 'Install FDT') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
	(select id from financial.cost_code_type where name = 'material'),
	(select id from aro.uom where name = 'unit_cost')
	,'drop cable', 'Drop Cable') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id,  name, description)
	values (
	(select id from financial.cost_code_type where name = 'material'),
	(select id from aro.uom where name = 'unit_cost')
	, 'splice_point', 'Splice Point Equipment') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'labor'),
		(select id from aro.uom where name = 'unit_per_hour')
	, 'install_splice_equipment', 'Install Splice Point') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_cost')
		, 'optical_model', 'Optical Modem') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_cost')
		, 'feeder_fiber', 'Feeder Fiber') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_cost')
	, 'distribution_fiber', 'Distribution Fiber') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'labor'),
		(select id from aro.uom where name = 'unit_per_hour')
	, 'install_fiber', 'Install Fiber') ;



-- Price for a Given Cost Coode By Time By State

DROP TABLE IF EXISTS "financial"."cost_assignment";
CREATE TABLE "financial"."cost_assignment" (
	"id" serial,
	date_from date,
	date_to date,
	state_code varchar(8)  not null,
	cost_code_id int4  not null references financial.cost_code,
	cost double precision  not null 
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."cost_assignment" OWNER TO "aro";

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'co_port'), 23.51) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'install_co_port'), 60.0) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'fdh_equipment'), 28595.0) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'fdt_equipment'), 547.5) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'feeder_fiber'), 4.88) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'distribution_fiber'), 4.88) ;


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


-- NETWORK_COST_CODE_DETAIL Defines the cost codes 

DROP TABLE IF EXISTS "financial"."network_code_detail";
CREATE TABLE "financial"."network_code_detail" (
	"id" serial primary key not null,
	network_cost_code_id int4 references financial.network_cost_code not null,
	cost_code_id int4 references financial.cost_code  not null,
	uom_id int4 not null references aro.uom ,
	quantity real not null,
	ratio_fixed_cost real  not null, 
	comment varchar,
	unique(network_cost_code_id,cost_code_id)
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."network_code_detail" OWNER TO "aro";

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost,comment)
	values ((select id from financial.network_cost_code where name = 'central_office'), 
			(select id from financial.cost_code where name = 'co_port'),
			(select id from aro.uom where name = 'atomic_feeder_unit'),
			1, 1.0, 'Ports required by Central Office') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id,  uom_id,  quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'central_office'), 
			(select id from financial.cost_code where name = 'install_co_port'),
			(select id from aro.uom where name = 'atomic_feeder_unit'),
			0.5, 1.0, 'Install Central Office Ports') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'fiber_distribution_hub'), 
			(select id from financial.cost_code where name = 'fdh_equipment'),
			(select id from aro.uom where name = 'unit_cost'),
			1,  1.0, 'FDH Cabinet and equipment') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'bulk_distribution_hub'), 
			(select id from financial.cost_code where name = 'fdh_equipment'),
			(select id from aro.uom where name = 'unit_cost'),
			1,  1.0, 'FDH Cabinet and equipment') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity,ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'fiber_distribution_terminal'), 
			(select id from financial.cost_code where name = 'fdt_equipment'),
			(select id from aro.uom where name = 'unit_cost'),
			1,  1.0, 'FDT Cabinet and equipment') ;


insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber'), 
			(select id from financial.cost_code where name = 'feeder_fiber'),
			(select id from aro.uom where name = 'unit_cost'),
			1,  1.0, 'Feeder Fiber Code') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber'), 
			(select id from financial.cost_code where name = 'distribution_fiber'),
			(select id from aro.uom where name = 'unit_cost'),
			1,  1.0, 'Distribution Fiber Code') ;


-- Mapping from network to network_cost_code

DROP TABLE IF EXISTS "financial"."network_cost_code_node_type";
CREATE TABLE "financial"."network_cost_code_node_type" (
	network_code_id int4 references financial.network_cost_code, 
	network_node_type_id int4 references client.network_node_types,
	primary key (network_code_id, network_node_type_id)
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."network_cost_code_node_type" OWNER TO "aro";

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'central_office'), 
			(select id from client.network_node_types where name = 'central_office')) ;

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'splice_point'), 
			(select id from client.network_node_types where name = 'splice_point')) ;

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'fiber_distribution_hub'), 
			(select id from client.network_node_types where name = 'fiber_distribution_hub')) ;

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'fiber_distribution_terminal'), 
			(select id from client.network_node_types where name = 'fiber_distribution_terminal')) ;


insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'bulk_distribution_hub'), 
			(select id from client.network_node_types where name = 'bulk_distrubution_terminal')) ;

insert into financial.network_cost_code_node_type (network_code_id, network_node_type_id)
	values ((select id from financial.network_cost_code where name = 'fiber_distribution_terminal'), 
			(select id from client.network_node_types where name = 'bulk_distribution_consumer')) ;


DROP TABLE IF EXISTS "financial"."network_code_fiber_type";
CREATE TABLE "financial"."network_code_fiber_type" (
	network_cost_code_id int4 references financial.network_cost_code, 
	fiber_route_type_id int4 references client.fiber_route_type,
	primary key (network_cost_code_id,fiber_route_type_id) 
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."network_code_fiber_type" OWNER TO "aro";

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber'),
			(select id from client.fiber_route_type where name = 'feeder')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber'),
			(select id from client.fiber_route_type where name = 'distribution')) ;

insert into financial.network_code_fiber_type (network_cost_code_id, fiber_route_type_id)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber'),
			(select id from client.fiber_route_type where name = 'backbone')) ;



create or replace view financial.network_price as 
select ca.date_from, ca.date_to, ca.state_code, ncc.id, ncc.name, u.name as uom_name,  case when u.name='atomic_feeder_unit' then 1 else 0 end as atomic_counting,   sum(ca.cost * cd.quantity) as price
from financial.network_cost_code ncc
join financial.network_code_detail cd on cd.network_cost_code_id = ncc.id
join financial.cost_code cc on cd.cost_code_id = cc.id
join financial.cost_assignment ca on ca.cost_code_id = cc.id
join aro.uom u on cd.uom_id = u.id
group by ncc.id, ca.state_code, ca.date_from, ca.date_to, ncc.name, u.name ;



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

-- Report Header

DROP TABLE IF EXISTS "financial"."network_report" cascade ;
create table financial.network_report (
	
	id bigserial primary key,
	
	report_type_id int4 not null references financial.report_type,
	plan_id int8 not null references client.plan on delete cascade,
	
	state_code varchar(16),
	pricing_date date
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."network_report" OWNER TO "aro";


DROP TABLE IF EXISTS "financial"."equipment_item_cost" cascade ;
create table financial.equipment_item_cost (
	
	id bigserial primary key,
	
	network_cost_code_id int4 references financial.network_cost_code,
	network_report_id int8 not null references financial.network_report on delete cascade ,
	network_node_id int8 not null references client.network_nodes on delete cascade,
		
	atomic_count double precision,
	quantity double precision,
	price double precision,
	total_cost double precision
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."equipment_item_cost" OWNER TO "aro";



DROP TABLE IF EXISTS "financial"."equipment_summary_cost" cascade ;
create table financial.equipment_summary_cost (
	
	id bigserial primary key,
	
	network_cost_code_id int4 references financial.network_cost_code,
	network_report_id int8 not null references financial.network_report on delete cascade ,
		
	atomic_count double precision,
	quantity double precision,
	price double precision,
	total_cost double precision
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."equipment_summary_cost" OWNER TO "aro";



DROP TABLE IF EXISTS "financial"."fiber_item_cost";
create table financial.fiber_item_cost (
	
	id bigserial primary key,
	
	network_cost_code_id int4 references financial.network_cost_code,
	network_report_id int8 not null references financial.network_report on delete cascade,
	fiber_route_id int8 not null references client.fiber_route on delete cascade,
	
	length_meters double precision,
	cost_per_meter double precision,
	total_cost double precision
	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."fiber_item_cost" OWNER TO "aro";

DROP TABLE IF EXISTS "financial"."fiber_summary_cost";
create table financial.fiber_summary_cost (
	id bigserial primary key,
	
	network_cost_code_id int8 references financial.network_cost_code,
	network_report_id int8 not null references financial.network_report on delete cascade,
		
	length_meters double precision,
	cost_per_meter double precision,
	total_cost double precision	
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."fiber_summary_cost" OWNER TO "aro";