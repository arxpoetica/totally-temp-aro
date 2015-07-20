-- Table: aro.edges
-- Edges stored with additional geographic/geometric data for dramatically faster computations

-- DROP TABLE aro.edges;

CREATE TABLE aro.edges AS 
SELECT
    gid,
    statefp,
    countyfp,
    'road_segment'::text AS edge_type,
    ST_Length(Geography(ST_Transform(the_geom, 4326))) as edge_length,
    ST_Transform(the_geom, 4326) as geom,
    Geography(ST_Transform(the_geom, 4326)) as geog
FROM
    tiger.edges
WHERE
        (mtfcc = 'S1640'
        OR
        mtfcc = 'S1400'
        -- OR
        -- mtfcc = 'S1630'
        OR
        mtfcc = 'S1200')
        AND
        countyfp = '061';

ALTER TABLE aro.edges
    ADD CONSTRAINT pkey_aro_edges_gid
        PRIMARY KEY (gid);


-- Add rail segments, but these won't be added to the routing graph yet
-- INSERT INTO aro.edges
-- (
--     gid,
--     statefp,
--     countyfp,
--     edge_type,
--     edge_length,
--     geom,
--     geog
-- )
-- SELECT
--     gid,
--     statefp,
--     countyfp,
--     'rail_segment'::text,
--     ST_Length(Geography(ST_Transform(the_geom, 4326))),
--     ST_Transform(the_geom, 4326),
--     Geography(ST_Transform(the_geom, 4326))
-- FROM
--     tiger.edges
-- WHERE
--     mtfcc IN ('R2011', 'R1051', 'R1052')
--     AND
--     countyfp = '033'
-- ;


CREATE INDEX idx_aro_edges_geom_gist ON aro.edges USING gist(geom);
CREATE INDEX idx_aro_edges_geog_gist ON aro.edges USING gist(geog);

VACUUM ANALYZE aro.edges;
