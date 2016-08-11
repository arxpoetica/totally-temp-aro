DROP TABLE IF EXISTS client.entity_category;

CREATE TABLE client.entity_category
(
	id serial,
	name varchar, -- "Standard" name for the category
	description varchar, -- Client-provided name to display in the app
	CONSTRAINT entity_category_pkey PRIMARY KEY (id)
);


INSERT INTO client.entity_category(name, description) VALUES('small', 'SMB');
INSERT INTO client.entity_category(name, description) VALUES('medium', 'Mid-tier (20-999 employees)');
INSERT INTO client.entity_category(name, description) VALUES('large', 'Large Enterprise (1000+ employees)');
INSERT INTO client.entity_category(name, description) VALUES('household', 'Household');
INSERT INTO client.entity_category(name, description) VALUES('celltower', 'Tower');
