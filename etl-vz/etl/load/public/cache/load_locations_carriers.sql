TRUNCATE client.locations_carriers CASCADE;

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

-