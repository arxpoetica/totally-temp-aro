DROP TABLE IF EXISTS client.business_category_mappings;

CREATE TABLE client.business_category_mappings
(
	id serial,
	business_id bigint,
	business_category_id int,
	CONSTRAINT client_business_category_mappings_pkey PRIMARY KEY (id)
);

CREATE INDEX client_business_category_mappings_business_index ON client.business_category_mappings(business_id);
CREATE INDEX client_business_category_mappings_business_category_index ON client.business_category_mappings(business_category_id);