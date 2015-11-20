DROP TABLE IF EXISTS client.customer_types;

CREATE TABLE client.customer_types
(
	id serial,
	name varchar,
	is_existing_cutomer boolean,
	CONSTRAINT client_customer_types_pkey PRIMARY KEY (id)
);

INSERT INTO client.customer_types(name, is_existing_cutomer)
VALUES
	('Customer', TRUE),
	('Prospect', FALSE);