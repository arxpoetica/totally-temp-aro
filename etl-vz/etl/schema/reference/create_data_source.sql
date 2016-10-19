
CREATE TABLE IF NOT EXISTS reference.data_source
(
  id serial primary key,
  name character varying,
  description character varying,
  is_user_defined boolean default true,
  created_at timestamp default now()
);

INSERT INTO reference.data_source(name, description, is_user_defined)
	 VALUES('system', 'System', false);

