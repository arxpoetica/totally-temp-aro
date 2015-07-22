-- Table: aro.household_summary

CREATE TABLE aro.household_summary
(
	id bigint,
	location_id bigint REFERENCES aro.locations,
	number_of_households int CHECK (number_of_households >= 0),
	install_cost_per_hh numeric CHECK (number_of_households >= 0),
	annual_recurring_cost_per_hh numeric CHECK (number_of_households >= 0),
	CONSTRAINT aro_household_summary_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_household_summary_location_index ON aro.household_summary(location_id);