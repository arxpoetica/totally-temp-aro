DROP TABLE IF EXISTS temp_hh.households;

CREATE TABLE temp_hh.households 
(
	id serial,
	address varchar,
	city varchar,
	state varchar,
	zip5 varchar,
	lat double precision,
	lon double precision,
	geog geography(POINT, 4326),
	CONSTRAINT temp_households_pkey PRIMARY KEY (id)
);

