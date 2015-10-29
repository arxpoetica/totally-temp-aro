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

-- COLT COMMERICIAL CUSTOMER TYPE MAPPING
-- We need to change how this mapping works.
-- For Colt, we know that the existing customers don't have 'address', since they're linked to a known location
-- Because of this, we'll load based on that field bein null.

-- Load prospect customers
INSERT INTO client.business_customer_types(business_id, customer_type_id)
	SELECT
		id AS business_id,
		(SELECT t.id FROM client.customer_types t WHERE t.name = 'Prospect')::int AS customer_type_id
	FROM aro.businesses
	WHERE address is not NULL;

-- Load current customers
INSERT INTO client.business_customer_types(business_id, customer_type_id)
	SELECT
		id AS business_id,
		(SELECT t.id FROM client.customer_types t WHERE t.name = 'Existing')::int AS customer_type_id
	FROM aro.businesses
	WHERE address is NULL;

-- Create household customer types, because the ARO ETL does this, too.
DROP TABLE IF EXISTS client.household_customer_types;


-- RESIDENTIAL CUSTOMER TYPE MAPPING
-- This is not used for Colt, since they only do commercial locations.
CREATE TABLE client.household_customer_types
(
	id serial,
	household_id bigint,
	customer_type_id bigint,
	CONSTRAINT client_household_customer_types_pkey PRIMARY KEY (id)
);
