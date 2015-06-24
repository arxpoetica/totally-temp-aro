-- Table: public.aro_industries

-- DROP TABLE public.aro_industries;

CREATE TABLE public.aro_industries AS
	SELECT DISTINCT ON (sic4)
		sic4 AS id,
		sic4desc AS description
	FROM infousa_businesses;

ALTER TABLE public.aro_industries ADD PRIMARY KEY (id);

ALTER TABLE public.aro_locations
  OWNER TO postgres;
GRANT ALL ON TABLE public.aro_locations TO aro;