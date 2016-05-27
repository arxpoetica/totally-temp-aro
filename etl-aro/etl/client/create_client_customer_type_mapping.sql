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

-- Load the business ids into the mapping table
INSERT INTO client.business_customer_types(business_id)
	SELECT id from aro.businesses;

-- All businesses are prospects for demo purposes
UPDATE client.business_customer_types
SET customer_type_id = (SELECT id FROM client.customer_types WHERE name = 'Prospect');


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

INSERT INTO client.household_customer_types(household_id)
	SELECT id from aro.households;

-- All households are prospects for demo purposes
UPDATE client.household_customer_types
SET customer_type_id = (SELECT id FROM client.customer_types WHERE name = 'Prospect');