DROP TABLE IF EXISTS sita.vz_wa_towers;
CREATE TABLE sita.vz_wa_towers
(
	cran_cluster_name varchar,
	cran_hub varchar,
	msc varchar,
	site_category_type varchar,
	site_name varchar,
	fiber_count_at_turn_up varchar,
	lateral_fiber_count varchar,
	lat double precision,
	lon double precision,
	location_type varchar,
	address varchar,
	city varchar,
	state varchar
);

