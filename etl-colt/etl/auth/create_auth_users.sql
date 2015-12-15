-- Table: auth.users

DROP TABLE IF EXISTS auth.users;

CREATE TABLE auth.users
(
  id SERIAL,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  email varchar NOT NULL,
  password varchar,
  company_name varchar,
  rol varchar,
  reset_code varchar,
  reset_code_expiration timestamp,
  CONSTRAINT auth_users_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX auth_users_email ON auth.users(email);
