-- Yay, more client-specifc shit in the general source ETL.
-- Also gotta love consistent usage of singular/plural in table naming. And quotes. Quotes are fun.

-- This table needs to be moved to reference, used by all SCHEMAS and unified with nbm data
DROP TABLE IF EXISTS "geotel"."carrier" cascade;
create table geotel.carrier (
	id serial primary key,
	code varchar(128) UNIQUE, --TODO Generalize
	name varchar(128) UNIQUE,
	is_competitor boolean,
	description varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE "geotel"."carrier" OWNER TO "aro";

insert into geotel.carrier (code, name, description, is_competitor)
select c.name, c.name, c.name, name != 'VERIZON'
from (select distinct carrier as name from geotel.fiber_plant) as c;
