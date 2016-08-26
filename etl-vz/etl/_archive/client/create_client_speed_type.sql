DROP TABLE IF EXISTS client.speed_type;

CREATE TABLE client.speed_type
(
	id serial,
	name varchar not null, -- "Standard" name for the category
	description varchar, -- Client-provided name to display in the app
	min_down int4 not null ,
	max_down int4 not null,
	strength double precision not null,
	CONSTRAINT speed_type_pkey PRIMARY KEY (id)
);


INSERT INTO client.speed_type(name, description, min_down, max_down, strength) 
		VALUES('cat2', 'cat2', 0, 3, 1.0);

INSERT INTO client.speed_type(name, description, min_down, max_down, strength) 
		VALUES('cat3', 'cat3', 3, 10, 1.0);

INSERT INTO client.speed_type(name, description, min_down, max_down, strength) 
		VALUES('cat4', 'cat4', 10, 25, 2.0);

INSERT INTO client.speed_type(name, description, min_down, max_down, strength) 
		VALUES('cat5', 'cat5', 25, 50, 3.0);

INSERT INTO client.speed_type(name, description, min_down, max_down, strength) 
		VALUES('cat6', 'cat6', 50, 100, 4.0);

INSERT INTO client.speed_type(name, description, min_down, max_down, strength) 
		VALUES('cat7', 'cat7', 100, 1000, 5.0);

INSERT INTO client.speed_type(name, description, min_down, max_down, strength) 
		VALUES('cat10', 'cat10', 1000, 1000000, 5.0);

