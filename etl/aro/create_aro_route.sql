-- Table: aro.route

CREATE TABLE aro.route
(
  id SERIAL,
  name varchar NOT NULL,
  number_of_strands int CHECK (number_of_strands >= 0),
  cable_type varchar,
  CONSTRAINT aro_route_pkey PRIMARY KEY (id)
);
