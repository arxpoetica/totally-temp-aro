
INSERT INTO aro.industries(id, description)
	SELECT DISTINCT ON (sic4)
		sic4 AS id,
		sic4desc AS description
	FROM businesses.infousa;