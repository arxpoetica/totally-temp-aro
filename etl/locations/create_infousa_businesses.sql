-- Table: public.infousa_businesses

-- DROP TABLE public.infousa_businesses;

CREATE TABLE public.infousa_businesses
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
	geog varchar
);

ALTER TABLE public.infousa_businesses
  OWNER TO postgres;
GRANT ALL ON TABLE public.infousa_businesses TO aro;