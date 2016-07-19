DROP TABLE IF EXISTS "financial"."component_input";
CREATE TABLE "financial"."component_input" (
	"id" serial PRIMARY KEY,
	speed_type_id int4 references client.speed_type,
	entity_category_id int4 references client.entity_category,
	
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
ALTER TABLE "financial"."component_input" OWNER TO "aro";


insert into financial.cost_code (speed_type_id, entity_category_id, penetration_start, entity_growth, churn_rate, churn_rate_decrease, opex_percent, maintenance_expenses, connection_cost)
	values (
	(select id from client.speed_type where name = 'cat3'),
	(select id from client.entity_category where name = 'small')
	,'co_port', 'Central Office Port Equipment' ) ;
