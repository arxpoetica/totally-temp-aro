
-- load_locations_distance_to_carrier
INSERT INTO client.locations_distance_to_carrier (location_id, carrier_id, distance)
  SELECT locations.id AS location_id,
    carriers.id AS carrier_id,
    MIN(ST_Distance(locations.geog, fiber_plant.geog)) AS distance
    FROM aro.locations
    JOIN aro.fiber_plant ON locations.geom && fiber_plant.buffer_geom
    JOIN aro.carriers ON fiber_plant.carrier_id = carriers.id AND carriers.route_type='fiber'
    GROUP BY locations.id, carriers.id;
