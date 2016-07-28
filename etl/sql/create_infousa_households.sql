DROP TABLE IF EXISTS infousa.households;

CREATE TABLE infousa.households 
(
	id serial,
	address varchar,
	city varchar,
	state varchar,
	zip5 varchar,
	lat double precision,
	lon double precision,
	geog geography(POINT, 4326),
	CONSTRAINT infousa_households_pkey PRIMARY KEY (id)
);

