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

-- Assign a fake customer type to each business.
-- This sucks because it might break since the id range of the customer_type table might not always be 1-3
UPDATE client.business_customer_types
SET customer_type_id = CAST((random() * 2) + 1 AS integer);


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

-- Assign a fake customer type to each household.
-- This sucks because it might break since the id range of the customer_type table might not always be 1-3
UPDATE client.household_customer_types
SET customer_type_id = CAST((random() * 2) + 1 AS integer);


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

-- Load the tower ids into the mapping table
INSERT INTO client.tower_customer_types(tower_id)
	SELECT id from aro.towers;

UPDATE client.tower_customer_types
	SET customer_type_id = (SELECT id FROM client.customer_types WHERE is_existing_customer=FALSE LIMIT 1);
