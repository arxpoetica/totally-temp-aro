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

-- Assign the count of InfoGroup households to a location
INSERT INTO aro.households (location_id, number_of_households)
	SELECT
		l.id AS location_id,
		COUNT(hh.location_id) AS hh_count
	FROM aro.temp_households hh
	JOIN aro.locations l 
		ON l.id = hh.location_id
	GROUP BY l.id;

-- Drop the reference table - not needed anymore
DROP TABLE aro.temp_households;


