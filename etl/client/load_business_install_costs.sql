CREATE TABLE client.business_install_costs
(
	id serial,
	business_id bigint,
	install_cost numeric,
	annual_recurring_cost numeric,
	CONSTRAINT client_business_install_costs_pkey PRIMARY KEY (id)
);

CREATE INDEX client_business_install_costs_business_index ON client.business_install_costs(business_id);

-- Move every business id from aro.businesses into the business_install_costs table
INSERT INTO client.business_install_costs(business_id)
	SELECT id from aro.businesses;

-- Set the install cost for every business to be between $100 and $500. This is a very rough estimate of cost range.
UPDATE client.business_install_costs
SET install_cost = CAST(((random() * 500) + 100) AS numeric);

-- Set the annual recurring cost for every business to be between $100 and $500. This is a very rough estimate of cost range.
UPDATE client.business_install_costs
SET annual_recurring_cost = CAST(((random() * 500) + 100) AS numeric);