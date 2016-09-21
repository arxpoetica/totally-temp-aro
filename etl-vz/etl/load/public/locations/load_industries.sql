TRUNCATE aro.industries CASCADE;

INSERT INTO aro.industries(id, description)
	SELECT DISTINCT ON (sic4)
		sic4 AS id,
		sic4desc AS description
	FROM ref_businesses.infousa_businesses_ny ;