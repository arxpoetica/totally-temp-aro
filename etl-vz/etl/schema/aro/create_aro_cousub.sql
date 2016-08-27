-- Table: aro.cousub

DROP TABLE IF EXISTS aro.cousub;
-- ----------------------------
--  Table structure for cousub
-- ----------------------------
DROP TABLE IF EXISTS "aro"."cousub";
CREATE TABLE "aro"."cousub" (
  "gid" int4 PRIMARY KEY,
  "statefp" varchar(2) COLLATE "default",
  "countyfp" varchar(3) COLLATE "default",
  "geoid" varchar(10) NOT NULL COLLATE "default",
  "name" varchar(100) COLLATE "default",
  "aland" numeric(14,0),
  "awater" numeric(14,0),
  "intptlat" varchar(11) COLLATE "default",
  "intptlon" varchar(12) COLLATE "default",
  "geom" "public"."geometry"
)
WITH (OIDS=FALSE);
ALTER TABLE "aro"."cousub" OWNER TO "aro";

ALTER TABLE aro.cousub
  ADD CONSTRAINT pk_aro_cousub PRIMARY KEY (geoid);


CREATE INDEX aro_cousub_geom_gist
  ON aro.cousub
  USING gist
  (geom);
