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
		ST_Length(geom),
		geom
	FROM tiger_edges
	WHERE 
		mtfcc = 'S1640'
		OR
		mtfcc = 'S1400'
		OR
		mtfcc = 'S1630'
		OR
		mtfcc = 'S1200';