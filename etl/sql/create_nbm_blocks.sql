DROP TABLE IF EXISTS nbm.blocks;

CREATE TABLE nbm.blocks
(
	objectid varchar,
	frn varchar,
	provname varchar,
	dbname varchar,
	hoconum varchar,
	hoconame varchar,
	stateabbr varchar,
	fullfipsid varchar,
	transtech varchar,
	maxaddown int,
	maxadup int,
	typicdown int,
	typicup int,
	downloadspeed int,
	uploadspeed int,
	provider_type int,
	end_user_cat int,
	CONSTRAINT nbm_blocks_pkey PRIMARY KEY (objectid)
);

