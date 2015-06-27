-- Table: aro.businesses

-- DROP TABLE aro.businesses;

CREATE TABLE aro.businesses
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

CREATE INDEX aro_businesses_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);



INSERT INTO aro.businesses(id, location_id, industry_id, name, address, number_of_employees)
	SELECT
		sourceid as id,
		bldgid as location_id,
		sic4 as industry_id,
		business as name,
		address,
		emps as number_of_employees
	FROM infousa.businesses;