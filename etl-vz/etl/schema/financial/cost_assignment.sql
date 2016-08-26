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

------ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTRACLE

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'fiber_default'), 22.95) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'fiber_ariel'), 19.0) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'fiber_buried'), 32.2) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'fiber_underground'), 20.0) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'fiber_conduit'), 12.0) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'fiber_obstacle'), 1000000000.00) ;


------ESTIMATED, ARIAL, BURIED, UNDERGROUND, CONDUIT, OBSTRACLE

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'distribution_fiber'), 22.95) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'distribution_fiber_arial'), 12.00) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'distribution_fiber_buried'), 40.00) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'distribution_fiber_underground'), 16.00) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'distribution_fiber_conduit'), 10.00) ;

insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'distribution_fiber_obstracle'), 100000000.00) ;


insert into financial.cost_assignment (date_from, date_to, state_code,  cost_code_id, cost)
	values ('2000-01-01', NULL, '*', (select id from financial.cost_code where name = 'bulk_distribution_terminal'), 0.0) ;
