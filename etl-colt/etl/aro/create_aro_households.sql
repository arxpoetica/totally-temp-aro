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


-- Add households for each location 
-- Approximate this value by dividing each census block's total households evenly among all locations in that census block
WITH
	locations_per_block AS 
	(
		SELECT
			census_blocks.tabblock_id,
			count(locations.id) as locs_per_block
		FROM
			aro.census_blocks INNER JOIN aro.locations
				ON ST_Within(locations.geom, census_blocks.geom)
		GROUP BY
			tabblock_id
	)
INSERT INTO aro.households
(
	location_id,
	number_of_households
)
SELECT
	locations.id AS location_id,
	(census_blocks.hh_2014 / locations_per_block.locs_per_block) as number_of_households
FROM
	aro.locations 
	INNER JOIN aro.census_blocks
		ON ST_Within(locations.geom, census_blocks.geom)
	INNER JOIN locations_per_block
		ON census_blocks.tabblock_id = locations_per_block.tabblock_id
;
