SELECT 
	biz.name,
	biz.address,
	industry.description AS business_type,
	loc.lat,
	loc.lon
FROM aro_businesses AS biz
JOIN aro_industries AS industry
ON biz.industry_id = industry.id
JOIN aro_locations as loc
ON biz.location_id = loc.id
WHERE biz.id = 402368356;