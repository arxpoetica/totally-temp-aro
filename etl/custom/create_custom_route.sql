-- Table: custom.route

CREATE TABLE custom.route
(
  id SERIAL,
  name varchar NOT NULL,
  number_of_strands int CHECK (number_of_strands >= 0),
  cable_type varchar,
  CONSTRAINT custom_route_pkey PRIMARY KEY (id)
);
