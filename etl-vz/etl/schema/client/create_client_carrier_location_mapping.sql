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


-- Calculate distnace to fiber for each location for each carrier
DROP TABLE IF EXISTS client.locations_distance_to_carrier;
CREATE TABLE client.locations_distance_to_carrier (
	distance float
);

ALTER TABLE client.locations_distance_to_carrier ADD COLUMN location_id bigint REFERENCES aro.locations ON DELETE CASCADE;
ALTER TABLE client.locations_distance_to_carrier ADD COLUMN carrier_id bigint REFERENCES aro.carriers ON DELETE CASCADE;
ALTER TABLE client.locations_distance_to_carrier ADD PRIMARY KEY (location_id, carrier_id);


-- ----------------------------
--  Table structure for census_blocks_carriers
-- ----------------------------
DROP TABLE IF EXISTS "client"."census_blocks_carriers";
CREATE TABLE "client"."census_blocks_carriers" (
	"census_block_gid" int4 NOT NULL,
	"state" varchar,
	"carrier_id" int4 NOT NULL,
	"download_speed" int4,
	"upload_speed" int4
);


ALTER TABLE client.census_blocks_carriers ADD PRIMARY KEY (census_block_gid, carrier_id);
ALTER TABLE client.census_blocks_carriers ADD
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
