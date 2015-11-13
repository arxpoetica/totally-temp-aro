DROP TABLE IF EXISTS client.products;

CREATE TABLE client.products
(
	id serial,
	product_type varchar,
	product_name varchar,
	
	CONSTRAINT pkey_products_id PRIMARY KEY (id)
);


CREATE TABLE client.industries
(
	id serial,
	industry_name varchar,
	
	CONSTRAINT pkey_industries_id PRIMARY KEY (id)
);

DROP TABLE IF EXISTS client.employees_by_location;

CREATE TABLE client.employees_by_location
(
	id serial,
	value_range varchar,
	min_value integer, 
	max_value integer,
	
	CONSTRAINT pkey_employees_by_location_id PRIMARY KEY (id)
);

CREATE INDEX client_employees_by_location_min_max_values ON client.employees_by_location(min_value, max_value);

DROP TABLE IF EXISTS client.spend;

CREATE TABLE client.spend
(
	id serial,
	city varchar,
	country varchar,
	product_id integer, 
	industry_id integer,
	employees_by_location_id integer, 
	year integer, 
	monthly_spend numeric,
	currency_abbrev character(3),
	
	CONSTRAINT pkey_spend_id PRIMARY KEY (id), 
	CONSTRAINT fkey_spend_product_id FOREIGN KEY (product_id) REFERENCES client.products (id) ON DELETE CASCADE,
	CONSTRAINT fkey_spend_industry_id FOREIGN KEY (industry_id) REFERENCES client.industries (id) ON DELETE CASCADE,
	CONSTRAINT fkey_spend_employees_by_location_id FOREIGN KEY (employees_by_location_id) REFERENCES client.employees_by_location (id) ON DELETE CASCADE
	
);

DROP TABLE IF EXISTS client.industry_mapping;

CREATE TABLE client.industry_mapping
(
	id serial,
	industry_id integer, 
	sic4 integer, 
	
	CONSTRAINT pkey_industry_mapping_id PRIMARY KEY (id), 
	CONSTRAINT fkey_industry_mapping_industry_id FOREIGN KEY (industry_id) REFERENCES client.industries (id) ON DELETE CASCADE
);