-- Table: aro.households

DROP TABLE IF EXISTS aro.households;

CREATE TABLE aro.households
(
	id SERIAL,
	location_id bigint REFERENCES aro.locations,
	number_of_households int CHECK (number_of_households >= 0),
	CONSTRAINT aro_household_summary_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_households_location_index ON aro.households(location_id);
