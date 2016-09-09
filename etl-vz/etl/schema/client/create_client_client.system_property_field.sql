DROP TABLE IF EXISTS client.system_property_field;
CREATE TABLE client.system_property_field (
    id serial PRIMARY KEY,
    name varchar(128) UNIQUE,
    type varchar(64) NOT NULL,
    description varchar(512)
) ;

INSERT INTO client.system_property_field
    (name, type, description)
VALUES
    ('max_feeder_fiber_length_meters', 'Double', 'Max Feeder Fiber Length') ; 


INSERT INTO client.system_property_field
    (name, type, description)
VALUES
    ('max_distribution_fiber_length_meters', 'Double', 'Max Distribution Fiber Length') ; 

