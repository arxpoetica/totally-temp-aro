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
