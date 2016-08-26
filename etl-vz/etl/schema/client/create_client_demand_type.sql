DROP TABLE IF EXISTS client.demand_type;

CREATE TABLE client.demand_type
(
	id serial,
	name varchar, -- "Standard" name for the category
	description varchar, -- Client-provided name to display in the app
	CONSTRAINT demand_type_pkey PRIMARY KEY (id)
);


INSERT INTO client.demand_type(name, description)
	 VALUES('new_demand', 'New demand at selected locations');
INSERT INTO client.demand_type(name, description) 
	VALUES('original_demand', 'Original demand at selected locations');
INSERT INTO client.demand_type(name, description) 
	VALUES('planned_demand', 'Planned demand at selected locations');
