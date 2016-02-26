-- Table: aro.edges
-- Edges stored with additional geographic/geometric data for dramatically faster computations

DROP TABLE IF EXISTS aro.edges;

CREATE TABLE aro.edges AS 
SELECT
    gid,
    tlid,
    tnidf,
    tnidt,
    statefp,
    countyfp,
    ST_Length(Geography(ST_Transform(the_geom, 4326))) as edge_length,
    ST_Transform(the_geom, 4326) as geom,
    Geography(ST_Transform(the_geom, 4326)) as geog,
    ST_Buffer(ST_Transform(the_geom, 4326), 40) as buffer
FROM
    tiger.edges
WHERE
        (mtfcc = 'S1640'
        OR
        mtfcc = 'S1400'
        -- OR
        -- mtfcc = 'S1630'
        OR
        mtfcc = 'S1200');
        

ALTER TABLE aro.edges
    ADD CONSTRAINT pkey_aro_edges_gid
        PRIMARY KEY (gid);

CREATE INDEX idx_aro_edges_geom_gist ON aro.edges USING gist(geom);
CREATE INDEX idx_aro_edges_geog_gist ON aro.edges USING gist(geog);
CREATE INDEX idx_aro_edges_buffer ON aro.edges USING gist(buffer);

VACUUM ANALYZE aro.edges;
