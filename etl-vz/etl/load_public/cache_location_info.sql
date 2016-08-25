-- Cache

-- Category mappings at an individual business level for detailed views
INSERT INTO client.business_category_mappings(business_id, business_category_id)
    SELECT
        id,
        (CASE
            WHEN number_of_employees > 0 AND number_of_employees < 20 THEN
                (SELECT client.business_categories.id FROM client.business_categories WHERE name = 'small' LIMIT 1)::int
            WHEN number_of_employees >= 20 and number_of_employees < 1000 THEN
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


-- client.spend fix

UPDATE client.spend SET city_id = (SELECT c.id FROM aro.cities c)::int;

-- Location Caching
UPDATE locations SET dn_entity_categories =
    array(
        SELECT DISTINCT 'b_' || bc.name
        FROM businesses b
        JOIN client.business_category_mappings bcm ON b.id = bcm.business_id
        JOIN client.business_categories bc ON bc.id = bcm.business_category_id
        WHERE b.location_id = locations.id
    )
    ||
    array(
        SELECT DISTINCT 'h_' || hc.name
        FROM households h
        JOIN client.household_category_mappings hcm ON h.id = hcm.household_id
        JOIN client.household_categories hc ON hc.id = hcm.household_category_id
        WHERE h.location_id = locations.id
    )
;

UPDATE aro.locations
   SET dn_entity_categories = (dn_entity_categories || ARRAY['b_2kplus']::varchar[])
  FROM aro.businesses
 WHERE monthly_recurring_cost >= 2000
   AND businesses.location_id = locations.id;