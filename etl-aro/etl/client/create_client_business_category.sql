
DROP TABLE IF EXISTS client.business_category CASCADE;

CREATE TABLE client.business_category
(
	id int4 references client.entity_category,
	min_value int4, -- min number employees (Open interval)
	max_value int4, -- max number employees (Closed interval)
	CONSTRAINT client_business_category_pkey PRIMARY KEY (id)
);

INSERT INTO client.business_category(id, min_value, max_value) 
	VALUES((select id from client.entity_category where name ='business_ukn'), 0, 1);
INSERT INTO client.business_category(id, min_value, max_value) 
	VALUES((select id from client.entity_category where name ='small'), 1, 20);
INSERT INTO client.business_category(id, min_value, max_value)
	VALUES((select id from client.entity_category where name ='medium'), 20, 1000);
INSERT INTO client.business_category(id, min_value, max_value) 
	VALUES((select id from client.entity_category where name ='large'), 1000, 9999999);
