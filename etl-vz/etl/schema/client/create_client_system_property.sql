DROP TABLE IF EXISTS client.system_property;
CREATE TABLE client.system_property (
    system_rule_id int4 REFERENCES client.system_rule,
    property_field_id int4 NOT NULL REFERENCES client.system_property_field,
    string_value VARCHAR(512),
    PRIMARY KEY (system_rule_id, property_field_id)
) ;

INSERT INTO client.system_property
    (system_rule_id, property_field_id, string_value)
VALUES
    (
        (SELECT id from client.system_rule where name ='system_defaults'), 
        (SELECT id from client.system_property_field where name ='max_feeder_fiber_length_meters'),
        '0.0'
    ) ; 

INSERT INTO client.system_property
    (system_rule_id, property_field_id, string_value)
VALUES
    (
        (SELECT id from client.system_rule where name ='system_defaults'), 
        (SELECT id from client.system_property_field where name ='max_distribution_fiber_length_meters'),
        '0.0'
    ) ; 

