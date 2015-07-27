-- Table demographics.households

-- DROP TABLE demographics.households;

CREATE TABLE demographics.households
(
	census_block varchar,
    xcoord double precision,
    ycoord double precision,
    hh_2014 double precision,
    pop_in_hh_2014 double precision,

    CONSTRAINT pkey_demographics_households_census_block PRIMARY KEY (census_block)
);

