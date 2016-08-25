
INSERT INTO aro.businesses(location_id, industry_id, name, address, number_of_employees, geog, geom)
	SELECT
		l.id AS location_id,
		b.sic4 AS industry_id,
		b.business AS name,
		b.address AS address,
		b.emps AS number_of_employees,
		b.geog AS geog,
		b.geog::geometry AS geom
	FROM businesses.infousa b
	JOIN aro.locations l
		ON ST_Equals(l.geom, b.geog::geometry);