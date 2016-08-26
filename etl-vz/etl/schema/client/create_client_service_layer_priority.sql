DROP TABLE IF EXISTS client.service_layer_priority ;
CREATE TABLE client.service_layer_priority 	(
	id serial PRIMARY KEY,
	system_rule_id int4  NOT NULL REFERENCES client.system_rule,
	service_layer_id int4  NOT NULL REFERENCES client.service_layer,
	default_priority int4 NOT NULL,
	UNIQUE(system_rule_id, service_layer_id)
) ; 

INSERT INTO client.service_layer_priority
	(system_rule_id, service_layer_id, default_priority)
VALUES
	(
		(SELECT id FROM client.system_rule WHERE name = 'system_defaults'),
		(SELECT id FROM client.service_layer WHERE name = 'wirecenter'),
		10) ;


INSERT INTO client.service_layer_priority
	(system_rule_id, service_layer_id, default_priority)
VALUES
	(
		(SELECT id FROM client.system_rule WHERE name = 'system_defaults'),
		(SELECT id FROM client.service_layer WHERE name = 'directional_facility'),
		20) ;

INSERT INTO client.service_layer_priority
	(system_rule_id, service_layer_id, default_priority)
VALUES
	(
		(SELECT id FROM client.system_rule WHERE name = 'system_defaults'),
		(SELECT id FROM client.service_layer WHERE name = 'cran'),
		30) ;
