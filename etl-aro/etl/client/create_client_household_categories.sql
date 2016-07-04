DROP TABLE IF EXISTS client.household_categories;

CREATE TABLE client.household_categories
(
	id serial,
	name varchar, -- "Standard" name for the category
	description varchar, -- Client-provided name to display in the app
	CONSTRAINT client_household_categories_pkey PRIMARY KEY (id)
);

INSERT INTO client.household_categories(name, description) VALUES('small', 'SFU');
INSERT INTO client.household_categories(name, description) VALUES('medium', 'MDU');