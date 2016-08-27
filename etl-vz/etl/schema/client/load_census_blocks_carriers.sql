
TRUNCATE client.census_blocks_carriers CASCADE ;

INSERT INTO client.census_blocks_carriers
(census_block_gid, carrier_id, download_speed, upload_speed)
	SELECT
		cb.gid AS census_block_gid,
		c.id AS carrier_id,
		MAX(blks.maxaddown) AS download_speed,
		MAX(blks.maxadup) AS upload_speed
	FROM aro.census_blocks cb
	JOIN nbm.blocks blks
	ON cb.tabblock_id = blks.fullfipsid
	JOIN aro.carriers c
	ON LOWER(c.name) = LOWER(blks.hoconame) -- THIS MIGHT BE A PROBLEMATIC JOIN CHECK ME WHEN THINGS GO WRONG
	WHERE c.route_type = 'ilec'
	GROUP BY census_block_gid, carrier_id
);