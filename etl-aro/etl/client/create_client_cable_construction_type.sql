DROP TABLE IF EXISTS client.cable_construction_type;

CREATE TABLE client.cable_construction_type
(
    id serial,
    name varchar, -- "Standard" name for the category
    description varchar, -- Client-provided name to display in the app
    CONSTRAINT cable_construction_type_pkey PRIMARY KEY (id)
);


INSERT INTO client.cable_construction_type(name, description) VALUES('estimated', 'Estimated');
INSERT INTO client.cable_construction_type(name, description) VALUES('arial', 'Arial');
INSERT INTO client.cable_construction_type(name, description) VALUES('buried', 'Buried');
INSERT INTO client.cable_construction_type(name, description) VALUES('underground', 'Underground');
INSERT INTO client.cable_construction_type(name, description) VALUES('obstacle', 'Obstacle');
INSERT INTO client.cable_construction_type(name, description) VALUES('conduit', 'Conduit');
