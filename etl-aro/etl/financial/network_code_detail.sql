
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
