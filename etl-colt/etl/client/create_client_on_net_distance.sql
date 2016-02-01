DROP TABLE IF EXISTS client.verizon_distance_to_on_net;

CREATE TABLE client.verizon_distance_to_on_net (
	distance float
);

ALTER TABLE client.verizon_distance_to_on_net ADD COLUMN verizon_location_id bigint REFERENCES aro.verizon_locations ON DELETE CASCADE;

ALTER TABLE client.verizon_distance_to_on_net ADD COLUMN on_net_location_id bigint REFERENCES aro.locations ON DELETE CASCADE;

ALTER TABLE client.verizon_distance_to_on_net ADD PRIMARY KEY (verizon_location_id, on_net_location_id);

WITH on_net_locs AS (
	SELECT DISTINCT ON (l.id)
		l.id,
		l.address,
		l.city,
		l.postal_code,
		l.country,
		l.geom,
		l.geog
	FROM aro.locations l
	JOIN aro.businesses b
	ON b.location_id = l.id
	JOIN client.business_customer_types ct
	ON ct.business_id = b.id
	WHERE ct.customer_type_id = 1
	AND l.country = 'France'
)
INSERT INTO client.verizon_distance_to_on_net (on_net_location_id, verizon_location_id, distance)
	SELECT 
		on_net_locs.id AS on_net_location_id,
		(SELECT aro.verizon_locations.id FROM aro.verizon_locations ORDER BY aro.verizon_locations.geom <-> on_net_locs.geom LIMIT 1) AS verizon_location_id,
		ST_Distance(on_net_locs.geog, (SELECT geog FROM aro.verizon_locations ORDER BY aro.verizon_locations.geom <-> on_net_locs.geom LIMIT 1)) AS distance
	FROM on_net_locs;