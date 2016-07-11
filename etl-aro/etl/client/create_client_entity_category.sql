DROP TABLE IF EXISTS client.entity_category;

CREATE TABLE client.entity_category
(
	id serial,
	name varchar, -- "Standard" name for the category
	description varchar, -- Client-provided name to display in the app
	CONSTRAINT entity_category_pkey PRIMARY KEY (id)
);


INSERT INTO client.entity_category(id, name, description) VALUES(0, 'total', 'All Categories');
INSERT INTO client.entity_category(name, description) VALUES('small', 'Business SMB');
INSERT INTO client.entity_category(name, description) VALUES('medium', 'Business Mid-Size');
INSERT INTO client.entity_category(name, description) VALUES('large', 'Business Enterprise');
INSERT INTO client.entity_category(name, description) VALUES('household', 'Residential Household');
INSERT INTO client.entity_category(name, description) VALUES('celltower', 'Celltower');