
--Wite Matching Algorithm
-- Make locations out of InfoGroup households (temp_hh.households)
INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geom, geog)
    SELECT DISTINCT ON (lat, lon)
        hh.address,
        hh.city,
        hh.state,
        hh.zip5,
        hh.lat,
        hh.lon,
        hh.geom,
        hh.geog
    FROM temp_hh.households hh
    JOIN aro.wirecenter_subset wc
        ON ST_Within(hh.geom, wc.geom);


-- Assign location_id of matching location to row on insert
INSERT INTO aro.temp_households (location_id, address, city, state, zipcode, lat, lon, geog, geom)
	SELECT
		loc.id,
		hh.address,
		hh.city,
		hh.state,
		hh.zip5 AS zipcode,
		hh.lat,
		hh.lon,
		hh.geog,
		hh.geom
	FROM temp_hh.households hh
	JOIN aro.locations loc
		ON ST_Equals(loc.geom, hh.geom)
	JOIN aro.wirecenter_subset wc
  	ON ST_Within(hh.geom, wc.geom);

-- Assign the count of InfoGroup households to a location
INSERT INTO aro.households (location_id, number_of_households)
	SELECT
		l.id AS location_id,
		COUNT(hh.location_id) AS hh_count
	FROM aro.temp_households hh
	JOIN aro.locations l 
		ON l.id = hh.location_id
	GROUP BY l.id;

-- Drop the reference table - not needed anymore
DROP TABLE aro.temp_households;


VACUUM ANALYZE aro.locations