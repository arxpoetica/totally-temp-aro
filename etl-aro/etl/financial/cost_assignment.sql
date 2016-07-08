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
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'feeder_fiber'), 22.95) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'distribution_fiber'), 22.95) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'bulk_distribution_terminal'), 0.0) ;
