DROP TABLE IF EXISTS client.customer_types;

CREATE TABLE client.customer_types
(
	id serial,
	name varchar,
	CONSTRAINT client_customer_types_pkey PRIMARY KEY (id)
);

-- Fake customer types for the fake client
INSERT INTO client.customer_types(name)
VALUES
	('Customer'),
	('Prospect');