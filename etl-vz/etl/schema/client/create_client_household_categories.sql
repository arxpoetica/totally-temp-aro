DROP TABLE IF EXISTS client.household_categories;

CREATE TABLE client.household_categories
(
	id serial,
	name varchar, -- "Standard" name for the category
	description varchar, -- Client-provided name to display in the app
	min_value integer,
	max_value integer,
	CONSTRAINT client_household_categories_pkey PRIMARY KEY (id)
);

INSERT INTO client.household_categories(name, description, min_value, max_value) VALUES('small', 'SFU', 0, 25);
INSERT INTO client.household_categories(name, description, min_value, max_value) VALUES('medium', 'MDU', 25, 1000000);
