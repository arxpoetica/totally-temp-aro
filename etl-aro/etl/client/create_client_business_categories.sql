DROP TABLE IF EXISTS client.business_categories;

CREATE TABLE client.business_categories
(
	id serial,
	name varchar, -- "Standard" name for the category
	description varchar, -- Client-provided name to display in the app
	CONSTRAINT client_business_categories_pkey PRIMARY KEY (id)
);

INSERT INTO client.business_categories(name, description) VALUES('small', 'SMB');
INSERT INTO client.business_categories(name, description) VALUES('medium', 'Mid-Size');
INSERT INTO client.business_categories(name, description) VALUES('large', 'Enterprise');