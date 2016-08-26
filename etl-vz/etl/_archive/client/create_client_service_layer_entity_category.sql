DROP TABLE IF EXISTS client.service_layer_entity_category ;
CREATE TABLE client.service_layer_entity_category (
	id serial PRIMARY KEY,
	system_rule_id int4 REFERENCES client.system_rule,
	service_layer_id int4  REFERENCES client.service_layer,
	entity_category_id int4 REFERENCES client.entity_category,
	UNIQUE(system_rule_id, service_layer_id, entity_category_id)
) ; 


INSERT INTO client.service_layer_entity_category 
	(system_rule_id, service_layer_id, entity_category_id)
VALUES(
	(SELECT id FROM client.system_rule WHERE name = 'system_defaults'),
	(SELECT id FROM client.service_layer WHERE name = 'wirecenter'),
	(SELECT id FROM client.entity_category WHERE name = 'small')) ;

INSERT INTO client.service_layer_entity_category 
	(system_rule_id, service_layer_id, entity_category_id)
VALUES(
	(SELECT id FROM client.system_rule WHERE name = 'system_defaults'),
	(SELECT id FROM client.service_layer WHERE name = 'wirecenter'),
	(SELECT id FROM client.entity_category WHERE name = 'household')) ;

INSERT INTO client.service_layer_entity_category 
	(system_rule_id, service_layer_id, entity_category_id)
VALUES(
	(SELECT id FROM client.system_rule WHERE name = 'system_defaults'),
	(SELECT id FROM client.service_layer WHERE name = 'wirecenter'),
	(SELECT id FROM client.entity_category WHERE name = 'celltower')) ;

INSERT INTO client.service_layer_entity_category 
	(system_rule_id, service_layer_id, entity_category_id)
VALUES(
	(SELECT id FROM client.system_rule WHERE name = 'system_defaults'),
	(SELECT id FROM client.service_layer WHERE name = 'wirecenter'),
	(SELECT id FROM client.entity_category WHERE name = 'medium')) ;

INSERT INTO client.service_layer_entity_category 
	(system_rule_id, service_layer_id, entity_category_id)
VALUES(
	(SELECT id FROM client.system_rule WHERE name = 'system_defaults'),
	(SELECT id FROM client.service_layer WHERE name = 'wirecenter'),
	(SELECT id FROM client.entity_category WHERE name = 'large')) ;
