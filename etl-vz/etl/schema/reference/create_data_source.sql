CREATE TABLE IF NOT EXISTS client.data_source
(
  id serial,
  name character varying,
  description character varying,
  is_user_defined boolean default true,
  created_at timestamp default now()
);

INSERT INTO client.data_source(name, description, is_user_defined)
	 VALUES('system', 'System', false);

