-- Table sti.households

DROP TABLE IF EXISTS sti.households;

CREATE TABLE sti.households
(
	census_block varchar,
    xcoord double precision,
    ycoord double precision,
    hh_2014 double precision,
    pop_in_hh_2014 double precision,

    CONSTRAINT pkey_sti_households_census_block PRIMARY KEY (census_block)
);

