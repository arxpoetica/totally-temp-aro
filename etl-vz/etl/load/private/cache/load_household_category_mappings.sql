TRUNCATE client.household_category_mappings CASCADE;

-- Category mappings at an individual business level for detailed views
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

-- Category mappings at a location level for map rendering logic where low-level detail is not needed
WITH location_household_category_mapping AS
(
	SELECT
		l.id AS location_id,
		(CASE
			WHEN max(hh.number_of_households) <= 24 THEN
				'small'
			WHEN max(hh.number_of_households) > 24 THEN
				'medium'
			END) AS category_assignment
	FROM aro.locations l
	JOIN aro.households hh
		ON hh.location_id = l.id
	GROUP BY l.id
)
UPDATE aro.locations
SET dn_largest_household_category = lhcm.category_assignment
FROM
	(SELECT 
		location_id,
		category_assignment
	FROM location_household_category_mapping) AS lhcm
WHERE lhcm.location_id = id;
