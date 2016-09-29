DROP TABLE IF EXISTS client.household_category_mappings;

CREATE TABLE client.household_category_mappings
(
	id serial,
	household_id bigint,
	household_category_id int,
	CONSTRAINT client_household_category_mappings_pkey PRIMARY KEY (id)
);

CREATE INDEX client_household_category_mappings_household_index ON client.household_category_mappings(household_id);
CREATE INDEX client_household_category_mappings_household_category_index ON client.household_category_mappings(household_category_id);