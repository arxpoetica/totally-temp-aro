DROP TABLE IF EXISTS client.business_category_mappings;

CREATE TABLE client.business_category_mappings
(
	id serial,
	business_id bigint,
	business_category_id int,
	CONSTRAINT client_business_category_mappings_pkey PRIMARY KEY (id)
);

-- Category mappings at an individual business level for detailed views
INSERT INTO client.business_category_mappings(business_id, business_category_id)
	SELECT
		id,
		(CASE
			WHEN number_of_employees > 0 AND number_of_employees < 20 THEN
				(SELECT client.business_categories.id FROM client.business_categories WHERE name = 'small' LIMIT 1)::int
			WHEN number_of_employees > 20 and number_of_employees < 1000 THEN
				(SELECT client.business_categories.id FROM client.business_categories WHERE name = 'medium' LIMIT 1)::int
			WHEN number_of_employees >= 1000 THEN
				(SELECT client.business_categories.id FROM client.business_categories WHERE name = 'large' LIMIT 1)::int
			END) AS business_category_id
	FROM aro.businesses;

-- Category mappings at a location level for map rendering logic where low-level detail is not needed
WITH location_business_category_mapping AS
(
	SELECT
		l.id AS location_id,
		(CASE
			WHEN max(b.number_of_employees) < 20 THEN
				'small'
			WHEN max(b.number_of_employees) > 20 and max(b.number_of_employees) < 1000 THEN
				'medium'
			WHEN max(b.number_of_employees) >= 1000 THEN
				'large'
			END) AS category_assignment
	FROM aro.locations l
	JOIN aro.businesses b
		ON b.location_id = l.id
	GROUP BY l.id
)
UPDATE aro.locations
SET dn_largest_business_category = lbcm.category_assignment
FROM
	(SELECT 
		location_id,
		category_assignment
	FROM location_business_category_mapping) AS lbcm
WHERE lbcm.location_id = id;


CREATE INDEX client_business_category_mappings_business_index ON client.business_category_mappings(business_id);
CREATE INDEX client_business_category_mappings_business_category_index ON client.business_category_mappings(business_category_id);