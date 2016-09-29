DROP TABLE IF EXISTS aro.edges CASCADE;

-- EDGES
CREATE TABLE aro.edges (
    gid INTEGER,
    statefp varchar,
    countyfp varchar,
    tlid bigint,
    tnidf numeric,
    tnidt numeric,
    edge_type text,
    edge_length float,
    geog Geography(MULTILINESTRING, 4326),
    
    CONSTRAINT pkey_aro_edges_gid PRIMARY KEY (gid)
);

SELECT AddGeometryColumn('aro', 'edges', 'geom', 4326, 'MULTILINESTRING', 2);
SELECT AddGeometryColumn('aro', 'edges', 'buffer', 4326, 'GEOMETRY', 2);

CREATE INDEX idx_aro_edges_geom_gist ON aro.edges USING gist(geom);
CREATE INDEX idx_aro_edges_geog_gist ON aro.edges USING gist(geog);
CREATE INDEX idx_aro_edges_buffer ON aro.edges USING gist(buffer);