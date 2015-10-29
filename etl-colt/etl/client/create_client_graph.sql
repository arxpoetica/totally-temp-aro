-- Create the graph table

DROP TABLE IF EXISTS client.edge_network;

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

CREATE INDEX idx_client_edge_network_geom_gist ON client.edge_network USING gist(geom);




