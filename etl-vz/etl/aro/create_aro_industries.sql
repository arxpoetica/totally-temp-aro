-- Table: aro.industries

DROP TABLE IF EXISTS aro.industries;

CREATE TABLE aro.industries
(
	id int,
	description varchar,
	CONSTRAINT aro_industries_pkey PRIMARY KEY (id)
);

INSERT INTO aro.industries(id, description)
	SELECT DISTINCT ON (sic4)
		sic4 AS id,
		sic4desc AS description
	FROM businesses.infousa;


