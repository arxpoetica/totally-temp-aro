-- Table: aro.businesses

DROP TABLE IF EXISTS aro.businesses;

CREATE TABLE aro.businesses
(
	id serial,
	location_id varchar,
	industry_id int,
	name varchar,
	address varchar,
	number_of_employees integer,
	annual_recurring_cost numeric,
	geog geography (POINT, 4326),
	CONSTRAINT aro_businesses_pkey PRIMARY KEY (id)
);


INSERT INTO aro.businesses(location_id, name, address, geog)
	SELECT DISTINCT ON (sd_building_id, sd_customer_name)
		sd_building_id as location_id,
		sd_customer_name as name,
		(ad_house_number || ' ' || ad_street_name)::text AS address,
		ST_SetSRID(ST_Point(ad_longitude, ad_latitude),4326)::geography AS geog
	FROM source_colt.locations
	WHERE bm_building_category = 'Retail Building'
;

CREATE INDEX aro_businesses_location_index ON aro.businesses(location_id);
CREATE INDEX aro_businesses_industry_index ON aro.businesses(industry_id);
CREATE INDEX aro_businesses_geog_index ON aro.businesses USING gist(geog);