-- Table: auth.permissions

DROP TABLE IF EXISTS auth.permissions;

CREATE TABLE auth.permissions
(
  plan_id bigint NOT NULL REFERENCES client.plan ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  rol varchar NOT NULL,
  CONSTRAINT auth_permissions_pkey PRIMARY KEY (plan_id, user_id)
);
