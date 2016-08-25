-- Load the business ids into the mapping table
INSERT INTO client.business_customer_types(business_id)
	SELECT id from aro.businesses;

-- All businesses are prospects for demo purposes
UPDATE client.business_customer_types
SET customer_type_id = (SELECT id FROM client.customer_types WHERE name = 'Prospect');

INSERT INTO client.household_customer_types(household_id)
	SELECT id from aro.households;

-- All households are prospects for demo purposes
UPDATE client.household_customer_types
SET customer_type_id = (SELECT id FROM client.customer_types WHERE name = 'Prospect');

-- Load the tower ids into the mapping table
INSERT INTO client.tower_customer_types(tower_id)
	SELECT id from aro.towers;

UPDATE client.tower_customer_types
	SET customer_type_id = (SELECT id FROM client.customer_types WHERE is_existing_customer=FALSE LIMIT 1);



