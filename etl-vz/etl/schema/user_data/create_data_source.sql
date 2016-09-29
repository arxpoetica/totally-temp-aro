CREATE TABLE IF NOT EXISTS user_data.data_source(
	id bigserial PRIMARY KEY,
	user_id integer references auth.users(id),
	Name varchar, 
	Description varchar
);
