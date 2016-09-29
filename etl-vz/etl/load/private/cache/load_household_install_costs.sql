DROP TABLE IF EXISTS client.household_install_costs;

CREATE TABLE client.household_install_costs
(
	id serial,
	location_id bigint,
	install_cost_per_hh numeric,
	annual_recurring_cost_per_hh numeric,
	CONSTRAINT client_household_install_costs_pkey PRIMARY KEY (id)
);

CREATE INDEX client_household_install_costs_location_index ON client.household_install_costs (location_id);

-- INSERT INTO client.household_install_costs(location_id)
-- 	SELECT id from aro.locations;

-- UPDATE client.household_install_costs
-- SET install_cost_per_hh = CAST(((random() * 500) + 100) AS numeric);

-- UPDATE client.household_install_costs
-- SET annual_recurring_cost_per_hh = CAST(((random() * 500) + 100) AS numeric);