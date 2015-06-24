-- Table: public.aro_businesses

-- DROP TABLE public.aro_businesses;

CREATE TABLE public.aro_businesses AS
	SELECT 
		sourceid as id,
		bldgid as location_id,
		sic4 as industry_id,
		business as name,
		address,
		emps as number_of_employees
	FROM infousa_businesses;

-- Is there a way to add these above?
-- Is numeric the right data type for these?
ALTER TABLE public.aro_businesses ADD COLUMN install_cost numeric;
ALTER TABLE public.aro_businesses ADD COLUMN annual_recurring_cost numeric;

ALTER TABLE public.aro_businesses ADD PRIMARY KEY (id);

CREATE INDEX aro_businesses_location_index ON aro_businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro_businesses(industry_id);

ALTER TABLE public.aro_locations
  OWNER TO postgres;
GRANT ALL ON TABLE public.aro_locations TO aro;