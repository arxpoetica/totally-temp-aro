-- Table: aro.edges
-- Edges stored with additional geographic/geometric data for dramatically faster computations
-- ----------------------------
--  Table structure for edges
-- ----------------------------
DROP TABLE IF EXISTS "aro"."edges";
CREATE TABLE "aro"."edges" (
    "gid" int4 NOT NULL,
    "tlid" int8,
    "tnidf" numeric(10,0),
    "tnidt" numeric(10,0),
    "statefp" varchar(2) COLLATE "default",
    "countyfp" varchar(3) COLLATE "default",
    "edge_length" float8,
    "geom" "public"."geometry",
    "geog" "public"."geography",
    "buffer" "public"."geometry"
) ;

ALTER TABLE aro.edges
    ADD CONSTRAINT pkey_aro_edges_gid
        PRIMARY KEY (gid);

CREATE INDEX idx_aro_edges_geom_gist ON aro.edges USING gist(geom);
CREATE INDEX idx_aro_edges_geog_gist ON aro.edges USING gist(geog);
CREATE INDEX idx_aro_edges_buffer ON aro.edges USING gist(buffer);
