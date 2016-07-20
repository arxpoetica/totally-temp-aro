DROP TABLE IF EXISTS client.locations_carriers;

CREATE TABLE client.locations_carriers
(
	id serial,
	location_id bigint,
	carrier_id int,
	download_speed int,
	upload_speed int,
	provider_type int,
	CONSTRAINT client_locations_carriers_pkey PRIMARY KEY (id)
);

CREATE INDEX client_locations_carriers_location_index ON client.locations_carriers(location_id);
CREATE INDEX client_locations_carriers_carrier_index ON client.locations_carriers(carrier_id);

-- Mapping for carriers who have fiber routes
INSERT INTO client.locations_carriers(location_id, carrier_id)
	SELECT DISTINCT
		locations.id,
		fiber.carrier_id
	FROM aro.locations locations
	JOIN aro.fiber_plant fiber
	ON ST_Contains(fiber.buffer_geom, locations.geom);


-- Mapping for carriers from NBM
-- This is currently only being used for consumer locations, but will be mapped to any location
-- so we can easily incorporate this for commercial locations  in the future
INSERT INTO client.locations_carriers(location_id, carrier_id, download_speed, upload_speed, provider_type)
	SELECT
		DISTINCT(l.id) AS location_id,
		c.id AS carrier_id,
		MAX(blks.maxaddown) AS download_speed,
		MAX(blks.maxadup) AS upload_speed,
		blks.provider_type AS provider_type
	FROM aro.locations l
	JOIN aro.census_blocks cb
	ON st_contains(cb.geom, l.geom)
	JOIN nbm.blocks blks
	ON cb.tabblock_id = blks.fullfipsid
	JOIN aro.carriers c
	ON LOWER(c.name) = LOWER(blks.hoconame) -- THIS MIGHT BE A PROBLEMATIC JOIN CHECK ME WHEN THINGS GO WRONG
	WHERE c.route_type = 'ilec'
	GROUP BY location_id, carrier_id, provider_type;

-- Calculate distnace to fiber for each location for each carrier
DROP TABLE IF EXISTS client.locations_distance_to_carrier;

CREATE TABLE client.locations_distance_to_carrier (
	distance float
);

ALTER TABLE client.locations_distance_to_carrier ADD COLUMN location_id bigint REFERENCES aro.locations ON DELETE CASCADE;

ALTER TABLE client.locations_distance_to_carrier ADD COLUMN carrier_id bigint REFERENCES aro.carriers ON DELETE CASCADE;

ALTER TABLE client.locations_distance_to_carrier ADD PRIMARY KEY (location_id, carrier_id);


INSERT INTO client.locations_distance_to_carrier (location_id, carrier_id, distance)
  SELECT locations.id AS location_id,
    carriers.id AS carrier_id,
    MIN(ST_Distance(locations.geog, fiber_plant.geog)) AS distance
    FROM locations
    JOIN fiber_plant ON locations.geom && fiber_plant.buffer_geom
    JOIN carriers ON fiber_plant.carrier_id = carriers.id AND carriers.route_type='fiber'
    GROUP BY locations.id, carriers.id;


DROP TABLE IF EXISTS client.census_bocks_carriers;

CREATE TABLE client.census_bocks_carriers AS (
	SELECT
		cb.gid AS census_block_gid,
		c.id AS carrier_id,
		MAX(blks.maxaddown) AS download_speed,
		MAX(blks.maxadup) AS upload_speed,
	FROM aro.census_blocks cb
	JOIN nbm.blocks blks
	ON cb.tabblock_id = blks.fullfipsid
	JOIN aro.carriers c
	ON LOWER(c.name) = LOWER(blks.hoconame) -- THIS MIGHT BE A PROBLEMATIC JOIN CHECK ME WHEN THINGS GO WRONG
	WHERE c.route_type = 'ilec'
	GROUP BY census_block_gid, carrier_id
);

ALTER TABLE client.census_bocks_carriers ADD PRIMARY KEY (census_block_gid, carrier_id);

ALTER TABLE client.census_bocks_carriers ADD
	FOREIGN KEY (carrier_id) REFERENCES aro.carriers (id) ON DELETE CASCADE;


DROP TABLE IF EXISTS client.speeds;

CREATE TABLE client.speeds (code integer PRIMARY KEY, description character varying);

INSERT INTO client.speeds (code, description) VALUES
	(2, '200 kbps - 768 kbps'),
	(3, '768 kbps - 1.5 mbps'),
	(4, '1.5 mbps - 3 mbps'),
	(5, '3 mbps - 6 mbps'),
	(6, '6 mbps - 10 mbps'),
	(7, '10 mbps - 25 mbps'),
	(8, '25 mbps - 50 mbps'),
	(9, '50 mbps - 100 mbps'),
	(10, '100 mbps - 1 gbps'),
	(11, '+1 gbps');
