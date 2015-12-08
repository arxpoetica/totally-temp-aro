-- Table: auth.permissions

DROP TABLE IF EXISTS auth.permissions;

CREATE TABLE auth.permissions
(
  route_id bigint NOT NULL REFERENCES custom.route ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rol varchar NOT NULL,
  CONSTRAINT auth_permissions_pkey PRIMARY KEY (route_id, user_id)
);
