-- This table needs to be moved to reference and by all SCHEMAS
DROP TABLE IF EXISTS "geotel"."carrier_alias" cascade ;
create table geotel.carrier_alias (
	carrier_id int4 references geotel.carrier on delete cascade,
	carrier_alias varchar(128),
	UNIQUE(carrier_id, carrier_alias)
)
WITH (OIDS=FALSE);
ALTER TABLE "geotel"."carrier_alias" OWNER TO "aro";

insert into geotel.carrier_alias
select id, name
from geotel.carrier c ;
