-- Create the graph table

CREATE TABLE public.aro_graph
(
	id bigint,
	statefp character varying(2),
	countyfp character varying(3),
	edge_type varchar,
	edge_length double precision,
	source integer,
	target integer
);

SELECT AddGeometryColumn('aro_graph', 'geom', 4326, 'MULTILINESTRING', 2);

-- Load road segment edges in from the tiger edges data
INSERT INTO aro_graph (id, statefp, countyfp, edge_type, edge_length, geom)
	SELECT	
		gid,
		statefp,
		countyfp,
		featcat,
		ST_Length(ST_Transform(geom, 4326)),
		ST_Transform(geom, 4326)
	FROM tiger_edges
	WHERE 
		mtfcc = 'S1640'
		OR
		mtfcc = 'S1400'
		OR
		mtfcc = 'S1630'
		OR
		mtfcc = 'S1200';

-- Add locations and edges to graph
-- Locations will have edges drawn from their point coordinates to the closest end of an existing graph edge (TIGER road segment)

-- After all edges and vertices have been added to the graph, we use pgRouting to create a topology:
-- Need to figure out how to tune the 'precision' argument here (0.00001 is the suggested value in the pgRouting docs)
SELECT pgr_createTopology('aro_graph', 0.00001, 'geom', 'id');