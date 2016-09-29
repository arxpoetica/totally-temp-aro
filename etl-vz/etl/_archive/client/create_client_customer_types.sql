DROP TABLE IF EXISTS client.customer_types;

CREATE TABLE client.customer_types
(
	id serial,
	name varchar,
	is_existing_customer boolean,
	CONSTRAINT client_customer_types_pkey PRIMARY KEY (id)
);

-- Fake customer types for the fake client
INSERT INTO client.customer_types(name, is_existing_customer)
VALUES
	('Existing Copper', TRUE),
	('Existing Fiber', TRUE),
	('Prospect', FALSE);
