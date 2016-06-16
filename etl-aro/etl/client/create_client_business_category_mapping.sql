DROP TABLE IF EXISTS client.business_category_mappings;

CREATE TABLE client.business_category_mappings
(
	id serial,
	business_id bigint,
	business_category_id int,
	CONSTRAINT client_business_category_mappings_pkey PRIMARY KEY (id)
);

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

CREATE INDEX client_business_category_mappings_business_index ON client.business_category_mappings(business_id);
CREATE INDEX client_business_category_mappings_business_category_index ON client.business_category_mappings(business_category_id);