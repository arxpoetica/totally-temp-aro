-- Table: custom.users

DROP TABLE IF EXISTS custom.users;

CREATE TABLE custom.users
(
  id SERIAL,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  email varchar NOT NULL,
  password varchar NOT NULL,
  CONSTRAINT custom_users_pkey PRIMARY KEY (id)
);

CREATE INDEX custom_users_email ON custom.users(email);
