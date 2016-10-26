INSERT INTO network_equipment.fiber(source, is_partner_carrier, geom)
	SELECT
		'vzb_conduit',
		false,
		the_geom
	FROM network_equipment.vzb_conduit_1;

INSERT INTO network_equipment.fiber(source, is_partner_carrier, geom)
	SELECT
		'vzb_conduit',
		false,
		the_geom
	FROM network_equipment.vzb_conduit_2;

INSERT INTO network_equipment.fiber(source, is_partner_carrier, geom)
	SELECT
		'vzb_conduit',
		false,
		the_geom
	FROM network_equipment.vzb_conduit_3;