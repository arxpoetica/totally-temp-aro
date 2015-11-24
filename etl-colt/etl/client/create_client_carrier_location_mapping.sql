DROP TABLE IF EXISTS client.locations_carriers;

CREATE TABLE client.locations_carriers
(
	id serial,
	location_id bigint,
	carrier_id int,
	CONSTRAINT client_locations_carriers_pkey PRIMARY KEY (id)
);

CREATE INDEX client_locations_carriers_location_index ON client.locations_carriers(location_id);
CREATE INDEX client_locations_carriers_carrier_index ON client.locations_carriers(carrier_id);

-- Mapping for ILECs
-- Deutsche Telekom maps to all locations in Frankfurt
INSERT INTO client.locations_carriers(location_id, carrier_id)
	SELECT
		locations.id AS location_id,
		(SELECT carriers.id FROM aro.carriers carriers WHERE carriers.name = 'Deutsche Telekom' LIMIT 1)::int AS carrier_id
	FROM
		aro.locations locations
	WHERE
		locations.country = 'Germany';

-- Orange maps to all locations in Paris
INSERT INTO client.locations_carriers(location_id, carrier_id)
	SELECT
		locations.id AS location_id,
		(SELECT carriers.id FROM aro.carriers carriers WHERE carriers.name = 'Orange' LIMIT 1)::int AS carrier_id
	FROM
		aro.locations locations
	WHERE
		locations.country = 'France';

-- Mapping for carriers who display coverage areas and not fiber routes
-- Only Bouygues has this datatype for Colt.
INSERT INTO client.locations_carriers(location_id, carrier_id)
	SELECT
		locations.id AS location_id,
		(SELECT carriers.id FROM aro.carriers carriers WHERE carriers.name = 'Bouygues' LIMIT 1)::int AS carrier_id
	FROM aro.locations locations
	JOIN source_colt.competitor_fiber_bouygues_paris AS coverage_area
	ON ST_Contains(coverage_area.geom, locations.geom);

-- Mapping for carriers who have fiber routes
INSERT INTO client.locations_carriers(location_id, carrier_id)
	SELECT DISTINCT
		locations.id,
		fiber.carrier_id
	FROM aro.locations locations
	JOIN aro.fiber_plant fiber
	ON ST_Contains(fiber.buffer_geom, locations.geom);


-- Calculate distnace to fiber for each location for each carrier

DROP TABLE IF EXISTS client.locations_distance_to_carrier;

CREATE TABLE client.locations_distance_to_carrier (
	location_id integer,
	carrier_id integer,
	distance float
);

INSERT INTO client.locations_distance_to_carrier
  SELECT locations.id AS location_id,
    carriers.id AS carrier_id,
    ST_Distance(locations.geog,
        (SELECT geog FROM fiber_plant WHERE carrier_id=carriers.id ORDER BY fiber_plant.geom <-> locations.geom LIMIT 1)) AS distance
    FROM locations
	CROSS JOIN carriers;

DELETE FROM client.locations_distance_to_carrier WHERE distance IS NULL;
