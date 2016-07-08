DROP TABLE IF EXISTS client.business_categories;

CREATE TABLE client.business_categories
(
	id serial,
	name varchar, -- "Standard" name for the category
	description varchar, -- Client-provided name to display in the app
	min_value int4. -- min number employees (OPen interval)
	max_value int4, -- max number employees (Closed interval)
	CONSTRAINT client_business_categories_pkey PRIMARY KEY (id)
);

INSERT INTO client.business_categories(name, description, min_value, max_value) VALUES('small', 'SMB', 1, 20);
INSERT INTO client.business_categories(name, description, min_value, max_value) VALUES('medium', 'Mid-Size', 20, 1000);
INSERT INTO client.business_categories(name, description, min_value, max_value) VALUES('large', 'Enterprise', 1000, 9999999);

/*

Delta Script

alter table client.business_categories add column min_value int4 ;
alter table client.business_categories add column max_value int4 ;
update client.business_categories set min_value = 1, max_value =20 where name ='small' ;
update client.business_categories set min_value = 20, max_value =1000 where name ='medium' ;
update client.business_categories set min_value = 1000, max_value =9999999 where name ='large' ;

*/