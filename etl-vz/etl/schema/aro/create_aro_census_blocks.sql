-- Table: aro.census_blocks

-- ----------------------------
--  Table structure for census_blocks
-- ----------------------------
DROP TABLE IF EXISTS "aro"."census_blocks";
CREATE TABLE "aro"."census_blocks" (
  "gid" int4,
  "statefp" varchar(2) COLLATE "default",
  "countyfp" varchar(3) COLLATE "default",
  "tabblock_id" varchar(16) NOT NULL COLLATE "default",
  "name" varchar(20) COLLATE "default",
  "aland" float8,
  "awater" float8,
  "intptlat" varchar(11) COLLATE "default",
  "intptlon" varchar(12) COLLATE "default",
  "geom" "public"."geometry"
)
WITH (OIDS=FALSE);
ALTER TABLE "aro"."census_blocks" OWNER TO "aro";

ALTER TABLE aro.census_blocks
  ADD CONSTRAINT pk_aro_census_blocks PRIMARY KEY (tabblock_id);


CREATE INDEX aro_census_blocks_geom_gist
  ON aro.census_blocks
  USING gist
  (geom);
