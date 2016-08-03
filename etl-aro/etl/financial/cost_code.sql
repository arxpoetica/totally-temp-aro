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

--Fiber ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTRACLE

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_per_meter')
		, 'fiber_default', 'Default Fiber') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_per_meter')
		, 'fiber_arial', 'Fiber Arial') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_per_meter')
		, 'fiber_burried', 'Feeder Fiber Buried') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_per_meter')
		, 'fiber_underground', 'Fiber Underground') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_per_meter')
		, 'fiber_conduit', 'Fiber Conduit') ;

insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'material'),
		(select id from aro.uom where name = 'unit_per_meter')
		, 'fiber_obstacle', 'Fiber Obstacle') ;


insert into financial.cost_code (cost_code_type_id, unit_of_measure_id, name, description)
	values (
		(select id from financial.cost_code_type where name = 'labor'),
		(select id from aro.uom where name = 'unit_per_hour')
	, 'install_fiber', 'Install Fiber') ;


insert into financial.cost_code (cost_code_type_id, unit_of_measure_id,  name, description)
	values (
	(select id from financial.cost_code_type where name = 'material'),
	(select id from aro.uom where name = 'unit_cost')
	, 'bulk_distribution_terminal', 'Bulk Distribution Terminal Equipment') ;

