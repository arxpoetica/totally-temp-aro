DROP TABLE IF EXISTS client.business_customer_types;
CREATE TABLE client.business_customer_types
(
	id serial,
	business_id bigint,
	customer_type_id bigint,
	CONSTRAINT client_business_customer_types_pkey PRIMARY KEY (id)
);

CREATE INDEX client_business_customer_types_business_index ON client.business_customer_types(business_id);
CREATE INDEX client_business_customer_types_customer_type_index ON client.business_customer_types(customer_type_id);


DROP TABLE IF EXISTS client.household_customer_types;
CREATE TABLE client.household_customer_types
(
	id serial,
	household_id bigint,
	customer_type_id bigint,
	CONSTRAINT client_household_customer_types_pkey PRIMARY KEY (id)
);

CREATE INDEX client_household_customer_types_household_index ON client.household_customer_types(household_id);
CREATE INDEX client_household_customer_types_customer_type_index ON client.household_customer_types(customer_type_id);


DROP TABLE IF EXISTS client.tower_customer_types;
CREATE TABLE client.tower_customer_types
(
	id serial,
	tower_id bigint,
	customer_type_id bigint,
	CONSTRAINT client_tower_customer_types_pkey PRIMARY KEY (id)
);

CREATE INDEX client_tower_customer_types_tower_index ON client.tower_customer_types(tower_id);
CREATE INDEX client_tower_customer_types_customer_type_index ON client.tower_customer_types(customer_type_id);

