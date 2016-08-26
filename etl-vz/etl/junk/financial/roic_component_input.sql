DROP TABLE IF EXISTS "financial"."roic_component_input";
CREATE TABLE "financial"."roic_component_input" (
	"id" bigserial PRIMARY KEY,
	speed_type_id int4 references client.speed_type,
	entity_category_id int4 references client.entity_category,
	
	arpu double precision,

	penetration_start double precision,
	penetration_end double precision,
	penetration_rate double precision,

	entity_growth double precision,
	churn_rate double precision,
	churn_rate_decrease double precision,
	opex_percent double precision,
	maintenance_expenses double precision,
	connection_cost double precision

	--arpu, premisies count, 

)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."roic_component_input" OWNER TO "aro";


--household

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat3'),
	(select id from client.entity_category where name = 'household'),
	487.26,
	0.25, 0.0,-0.25,
	0.01, 0.251948060522802, 0.0, 
	0.67, 0.0423, 0.0) ;

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat7'),
	(select id from client.entity_category where name = 'household'),
	1489.464,
	0.0, 1.0,-0.25,
	0.01, 0.144275782612619, 0.0, 
	0.48, 0.0423, 434) ;

--SMB

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat3'),
	(select id from client.entity_category where name = 'small'),
	487.26,
	0.25, 0.0,-0.25,
	0.01, 0.198791603551029, 0.0, 
	0.57, 0.0423, 0.0) ;

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat7'),
	(select id from client.entity_category where name = 'small'),
	1306.392,
	0.0, 1.0,-0.25,
	0.01, 0.198791603551029, 0.0, 
	0.43, 0.0423, 434) ;

--medium

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat3'),
	(select id from client.entity_category where name = 'medium'),
	0,
	0.3, 0.0,-0.25,
	0.01, 0.198791603551029, 0.0, 
	0.57, 0.0423, 0.0) ;

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat7'),
	(select id from client.entity_category where name = 'medium'),
	1306.392,
	0.0, 1.0,-0.25,
	0.01, 0.198791603551029, 0.0, 
	0.43, 0.0423, 700) ;

--large

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat3'),
	(select id from client.entity_category where name = 'large'),
	0,
	0.3, 0.0,-0.25,
	0.01, 0.198791603551029, 0.0, 
	0.57, 0.0423, 0.0) ;

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat7'),
	(select id from client.entity_category where name = 'large'),
	1306.392,
	0.0, 1.0,-0.25,
	0.01, 0.198791603551029, 0.0, 
	0.43, 0.0423, 700) ;

--celltower

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat3'),
	(select id from client.entity_category where name = 'celltower'),
	0,
	0.3, 0.0,-0.25,
	0.01, 0.198791603551029, 0.0, 
	0.57, 0.0423, 0.0) ;

insert into financial.roic_component_input 
	(speed_type_id, entity_category_id, arpu,
	 penetration_start, penetration_end, penetration_rate,
	 entity_growth, churn_rate, churn_rate_decrease, 
	 opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat7'),
	(select id from client.entity_category where name = 'celltower'),
	1306.392,
	0.0, 1.0,-0.25,
	0.01, 0.198791603551029, 0.0, 
	0.43, 0.0423, 700) ;






