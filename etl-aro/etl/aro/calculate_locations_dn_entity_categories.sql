ALTER TABLE locations ADD COLUMN dn_entity_categories character varying[];

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

ALTER TABLE aro.businesses ADD COLUMN monthly_recurring_cost numeric;
ALTER TABLE aro.businesses ADD COLUMN source varchar;

UPDATE aro.locations
   SET dn_entity_categories = (dn_entity_categories || ARRAY['b_2kplus']::varchar[])
  FROM aro.businesses
 WHERE monthly_recurring_cost >= 2000
   AND businesses.location_id = locations.id;
