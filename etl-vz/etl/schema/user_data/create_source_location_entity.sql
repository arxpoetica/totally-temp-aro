CREATE TABLE IF NOT EXISTS user_data.source_location_entity(
	id bigserial PRIMARY KEY,
	data_source_id bigint REFERENCES user_data.data_source(id) ,
	location_class int,
	entity_category_id integer,
	lat double precision,
	long double precision,
	point geometry,
	custom_attributes hstore
);


--Commented out because only on Postgres 9.5 can INDEXES be conditionally built
--CREATE INDEX idx_user_data_sle_source_id ON user_data.source_location_entity(data_source_id);
