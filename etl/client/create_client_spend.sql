CREATE TABLE client.products
(
	id serial,
	product_type varchar,
	product_name varchar,
	
	CONSTRAINT pkey_products_id PRIMARY KEY (id)
);

CREATE TABLE client.spend
(
	id serial,
	product_id integer, 
	industry_name varchar,
	employees_at_location integer, 
	year integer, 
	monthly_spend integer,
	
	CONSTRAINT pkey_spend_id PRIMARY KEY (id), 
	CONSTRAINT fkey_spend_product_id FOREIGN KEY (product_id) REFERENCES client.products (id) ON DELETE CASCADE
);