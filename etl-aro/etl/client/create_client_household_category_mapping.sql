DROP TABLE IF EXISTS client.household_category_mappings;

CREATE TABLE client.household_category_mappings
(
	id serial,
	household_id bigint,
	household_category_id int,
	CONSTRAINT client_household_category_mappings_pkey PRIMARY KEY (id)
);

INSERT INTO client.household_category_mappings(household_id, household_category_id)
	SELECT
		id,
		(CASE
			WHEN number_of_households <= 24 THEN
				(SELECT client.household_categories.id FROM client.household_categories WHERE name = 'small' LIMIT 1)::int
			WHEN number_of_households > 24 THEN
				(SELECT client.household_categories.id FROM client.household_categories WHERE name = 'medium' LIMIT 1)::int
			END) AS household_category_id
	FROM aro.households;

CREATE INDEX client_household_category_mappings_household_index ON client.household_category_mappings(household_id);
CREATE INDEX client_household_category_mappings_household_category_index ON client.household_category_mappings(household_category_id);