-- Table: public.aro_businesses

-- DROP TABLE public.aro_businesses;

CREATE TABLE public.aro_businesses
(
	id bigint,
	location_id bigint,
	industry_id int,
	name varchar,
	address varchar,
	number_of_employees integer,
	install_cost numeric,
	annual_recurring_cost numeric,
	CONSTRAINT aro_businesses_pkey PRIMARY KEY (id)
);

CREATE INDEX aro_businesses_location_index ON aro_businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro_businesses(industry_id);

ALTER TABLE public.aro_locations
  OWNER TO postgres;
GRANT ALL ON TABLE public.aro_locations TO aro;

INSERT INTO public.aro_businesses(id, location_id, industry_id, name, address, number_of_employees)
	SELECT
		sourceid as id,
		bldgid as location_id,
		sic4 as industry_id,
		business as name,
		address,
		emps as number_of_employees
	FROM infousa_businesses;