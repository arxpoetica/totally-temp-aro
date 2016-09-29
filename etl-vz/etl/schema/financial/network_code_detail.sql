
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
			(select id from financial.cost_code where name = 'bulk_distribution_terminal'),
			(select id from aro.uom where name = 'unit_cost'),
			1,  1.0, 'bulk_distribution_terminal') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity,ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'fiber_distribution_terminal'), 
			(select id from financial.cost_code where name = 'fdt_equipment'),
			(select id from aro.uom where name = 'unit_cost'),
			1,  1.0, 'FDT Cabinet and equipment') ;

--Fiber ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTACLE

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber'), 
			(select id from financial.cost_code where name = 'fiber_default'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Feeder Default') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_ariel'), 
			(select id from financial.cost_code where name = 'fiber_ariel'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Feeder Arial') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_buried'), 
			(select id from financial.cost_code where name = 'fiber_buried'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Feeder Buried') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_underground'), 
			(select id from financial.cost_code where name = 'fiber_underground'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Feeder Underground') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_conduit'), 
			(select id from financial.cost_code where name = 'fiber_conduit'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Feeder Conduit') ;

values ((select id from financial.network_cost_code where name = 'feeder_fiber_planned_conduit'), 
	(select id from financial.cost_code where name = 'fiber_planned_conduit'),
	(select id from aro.uom where name = 'unit_per_meter'),
	1,  1.0, 'Feeder Planned Conduit') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'feeder_fiber_obstacle'), 
			(select id from financial.cost_code where name = 'fiber_obstacle'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Feeder Obstacle') ;



-- Distribution Fiber ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTACLE

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber'), 
			(select id from financial.cost_code where name = 'fiber_default'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Distribution Default') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber_ariel'), 
			(select id from financial.cost_code where name = 'fiber_ariel'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Distribution Arial') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber_buried'), 
			(select id from financial.cost_code where name = 'fiber_buried'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Distribution Buried') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber_underground'), 
			(select id from financial.cost_code where name = 'fiber_underground'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Distribution Underground') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber_conduit'), 
			(select id from financial.cost_code where name = 'fiber_conduit'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Distribution Conduit') ;

values ((select id from financial.network_cost_code where name = 'distribution_fiber_planned_conduit'), 
	(select id from financial.cost_code where name = 'fiber_planned_conduit'),
	(select id from aro.uom where name = 'unit_per_meter'),
	1,  1.0, 'Distribution Planned Conduit') ;


insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'distribution_fiber_obstacle'), 
			(select id from financial.cost_code where name = 'fiber_obstacle'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Distribution Obstacle') ;


-- Backbone Fiber ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTACLE

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber'), 
			(select id from financial.cost_code where name = 'fiber_default'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Backbone Default') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_ariel'), 
			(select id from financial.cost_code where name = 'fiber_ariel'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Backbone Arial') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_buried'), 
			(select id from financial.cost_code where name = 'fiber_buried'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Backbone Buried') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_underground'), 
			(select id from financial.cost_code where name = 'fiber_underground'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Backbone Underground') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_conduit'), 
			(select id from financial.cost_code where name = 'fiber_conduit'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Backbone Conduit') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_planned_conduit'), 
			(select id from financial.cost_code where name = 'planned_conduit'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Backbone Planned Conduit') ;

insert into financial.network_code_detail (network_cost_code_id, cost_code_id, uom_id, quantity, ratio_fixed_cost, comment)
	values ((select id from financial.network_cost_code where name = 'backbone_fiber_obstacle'), 
			(select id from financial.cost_code where name = 'fiber_obstacle'),
			(select id from aro.uom where name = 'unit_per_meter'),
			1,  1.0, 'Backbone Obstacle') ;