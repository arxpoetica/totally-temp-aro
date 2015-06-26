-- Table: public.aro_industries

-- DROP TABLE public.aro_industries;

CREATE TABLE public.aro_industries
(
	id int,
	description varchar,
	CONSTRAINT aro_industries_pkey PRIMARY KEY (id)
);

INSERT INTO aro_industries(id, description)
	SELECT DISTINCT ON (sic4)
		sic4 AS id,
		sic4desc AS description
	FROM infousa_businesses;

ALTER TABLE public.aro_locations
  OWNER TO postgres;
GRANT ALL ON TABLE public.aro_locations TO aro;


