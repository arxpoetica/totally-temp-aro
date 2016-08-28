-- Table: public.infousa_businesses

DROP TABLE IF EXISTS pub_businesses.infousa;

CREATE TABLE ref_businesses.infousa
(
business varchar,
address varchar,
city varchar,
state varchar,
zip varchar,
zip4 varchar,
emps integer,
sic4 integer,
sic4desc varchar,
bldgid bigint,
sourceid bigint,
lat double precision,
long double precision,
accuracy integer,
hqbranch integer,
familyid bigint,
familybus bigint,
familymsas integer,
geog geography (POINT, 4326) 
);