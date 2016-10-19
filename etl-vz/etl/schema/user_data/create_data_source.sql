CREATE TABLE IF NOT EXISTS user_data.data_source(
	id bigserial PRIMARY KEY,
	user_id integer references auth.users(id),
	name varchar, 
	description varchar,
	client_data_source_id integer
);
