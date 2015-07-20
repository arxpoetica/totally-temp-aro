
-- DROP INDEX infousa.infousa_businesses_geog_gist;

-- CREATE TABLE infousa.businesses
-- (
-- 	business varchar,
-- 	address varchar,
-- 	city varchar,
-- 	state varchar,
-- 	zip varchar,
-- 	zip4 varchar,
-- 	emps integer,
-- 	sic4 integer,
-- 	sic4desc varchar,
-- 	bldgid bigint,
-- 	sourceid bigint,
-- 	lat double precision,
-- 	long double precision,
-- 	accuracy integer,
-- 	hqbranch integer,
-- 	familyid bigint,
-- 	familybus bigint,
-- 	familymsas integer,
-- 	geog geography (POINT, 4326)
-- );

CREATE INDEX infousa_businesses_geog_gist ON infousa.businesses USING gist (geog);
CREATE INDEX infousa_businesses_sic4 ON infousa.businesses USING btree (sic4);