INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, geog, geom)
	SELECT
		l.id AS location_id,
		b.sic4 AS industry_id,
		b.business AS name,
		b.address AS address,
		b.emps AS number_of_employees,
		b.geog AS geog,
		b.geog::geometry AS geom
	FROM ref_businesses.infousa b
	JOIN aro.locations l
		ON ST_Equals(l.geom, b.geog::geometry);

-- Make locations out of InfoUSA businesses (infousa.businesses)
INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geog, geom)
    SELECT DISTINCT ON (bldgid)
        address,
        city,
        b.state,
        zip AS zipcode,
        lat,
        long AS lon,
        b.geog as geog,
        b.geog::geometry as geom
    FROM project_constraints.spatial wc,
        ref_businesses.infousa b
    WHERE ST_Contains(wc.geom, b.geog::geometry);




