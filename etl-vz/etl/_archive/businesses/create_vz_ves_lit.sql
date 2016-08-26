DROP TABLE IF EXISTS businesses.ves_lit;

CREATE TABLE businesses.ves_lit
(
	corporatename varchar,
	coclli varchar,
	address varchar,
	city varchar,
	state varchar,
	zip varchar,
	franchise_flag varchar,
	capacity varchar,
	n_total int,
	n_avail int,
	n_not_avail int,
	latitude double precision,
	longitude double precision,
	building_clli varchar
);

