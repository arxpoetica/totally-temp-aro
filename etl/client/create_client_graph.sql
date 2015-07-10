-- Create the graph table

-- TODO: Once we have enough data such that it's partitioned into states,
-- we'll need to do the same thing with the graph

-- DROP TABLE client.graph;


-- Create edge_network table used to aggregate all edges eventually used in the graph
-- DROP TABLE client.edge_network;

CREATE TABLE client.edge_network
(
    id serial,
    gid bigint,
    statefp character varying(2),
    countyfp character varying(3),
    edge_type varchar,
    edge_length double precision,
    source integer,
    target integer,

    CONSTRAINT pkey_client_edge_network_id PRIMARY KEY (id)
);

SELECT AddGeometryColumn('client', 'edge_network', 'geom', 4326, 'LINESTRING', 2);

-- Load road segment edges in from the tiger edges data
INSERT INTO client.edge_network (gid, statefp, countyfp, edge_type, edge_length, geom)
    SELECT  
        gid,
        statefp,
        countyfp,
        edge_type,
        edge_length,
        ST_GeometryN(geom,1)
    FROM aro.edges;


-- Draw segment from each loaction to the nearest road segment and add to edge_network
INSERT INTO client.edge_network 
(
    edge_type,
    -- edge_length,
    geom
)
SELECT
    'location_link',
    -- First retrieve the 5 closest edges to each location, using index-based bounding box search.
    -- Then measure geographic distance to each (spheroid calcualtion) and find the closest.
    -- Draw line connecting location to edge.
    ST_ShortestLine(locations.geom, (SELECT geom FROM ( SELECT edges.geom, ST_Distance(edges.geom::geography, locations.geom::geography) AS distance FROM aro.edges ORDER BY locations.geom <#> edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1))
FROM 
    aro.locations
WHERE
    ST_Distance(locations.geog, (SELECT geom FROM ( SELECT edges.geom, ST_Distance(edges.geom::geography, locations.geom::geography) AS distance FROM aro.edges ORDER BY locations.geom <#> edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1)::geography) <= 452.7
;

-- Draw segment from each of the client's splice points to the nearest road segment and add to edge_network
INSERT INTO client.edge_network
(
    edge_type,
    -- edge_length,
    geom
)
SELECT
    'splice_point_link',
    -- First retrieve the 5 closest edges to each splice_point, using index-based bounding box search.
    -- Then measure geographic distance to each (spheroid calcualtion) and find the closest.
    -- Draw line connecting splice_point to edge.
    ST_ShortestLine(splice_points.geom, (SELECT geom FROM ( SELECT edges.geom, ST_Distance(edges.geom::geography, splice_points.geom::geography) AS distance FROM aro.edges ORDER BY splice_points.geom <#> edges.geom LIMIT 5 ) AS index_query ORDER BY distance LIMIT 1))
FROM
    aro.splice_points
WHERE
    splice_points.carrier_name = 'VERIZON'
;
CREATE INDEX idx_client_edge_network_geom_gist ON client.edge_network USING gist(geom);


-- Create first-pass graph on edge_network table
SELECT pgr_createTopology('client.edge_network', 0.00001, 'geom');

-- Create noded network
SELECT pgr_nodeNetwork('client.edge_network', 0.00001, 'id', 'geom');


-- Rename the noded result table as the graph table, and add columns to pull in additional information
ALTER TABLE client.edge_network_noded
    RENAME TO graph;


ALTER TABLE client.graph
    RENAME CONSTRAINT edge_network_noded_pkey TO graph_pkey;

ALTER TABLE client.graph
    ADD COLUMN gid BIGINT,
    ADD COLUMN statefp VARCHAR(2),
    ADD COLUMN countyfp VARCHAR(3),
    ADD COLUMN edge_type VARCHAR,
    ADD COLUMN edge_length DOUBLE PRECISION;

ALTER INDEX client.edge_network_noded_geom_idx
    RENAME TO graph_geom_idx;

-- Populate values for newly added columns
UPDATE client.graph
SET 
    gid = net.gid,
    statefp = net.statefp,
    countyfp = net.countyfp,
    edge_type = net.edge_type,
    edge_length = ST_Length(Geography(graph.geom))
FROM
    client.edge_network AS net
WHERE
    net.id = graph.old_id;


-- Create routing topology on graph table
SELECT pgr_createTopology('client.graph', 0.000001, 'geom');

