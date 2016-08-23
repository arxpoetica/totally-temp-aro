DROP TABLE IF EXISTS client.product_type;

CREATE TABLE client.product_type
(
	id serial,
	name varchar, -- "Standard" name for the category
	description varchar, -- Client-provided name to display in the app
	CONSTRAINT product_type_pkey PRIMARY KEY (id)
);

INSERT INTO client.product_type(name, description) VALUES('broadband', 'broadband');

