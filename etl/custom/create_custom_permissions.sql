-- Table: custom.permissions

DROP TABLE IF EXISTS custom.permissions;

CREATE TABLE custom.permissions
(
  route_id bigint NOT NULL REFERENCES custom.route ON DELETE CASCADE,
  user_id bigint NOT NULL REFERENCES custom.users ON DELETE CASCADE,
  CONSTRAINT custom_permissions_pkey PRIMARY KEY (route_id, user_id)
);
