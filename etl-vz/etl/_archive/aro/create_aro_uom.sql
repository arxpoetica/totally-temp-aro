
-- UOM Table

DROP TABLE IF EXISTS aro.uom;
CREATE TABLE aro.uom (
  "id" serial PRIMARY KEY,
  "name" varchar(32) UNIQUE,
  "description" varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE aro.uom OWNER TO "aro";

insert into aro.uom (name, description) values ('unit_per_hour', 'Cost Per Hour') ;
insert into aro.uom (name, description) values ('unit_per_meter', 'Cost Per Meter') ;
insert into aro.uom (name, description) values ('unit_cost', 'Unit Cost') ;
insert into aro.uom (name, description) values ('atomic_feeder_unit', 'Atomic Feeder Unit') ;
insert into aro.uom (name, description) values ('atomic_dist_unit', 'Atomic Distrbution Unit') ;