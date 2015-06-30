-- Create the graph table

-- TODO: Once we have enough data such that it's partitioned into states,
-- we'll need to do the same thing with the graph

CREATE TABLE aro.graph
(
	id serial,
	gid bigint,
	statefp character varying(2),
	countyfp character varying(3),
	edge_type varchar,
	edge_length double precision,
	source integer,
	target integer
);

SELECT AddGeometryColumn('aro', 'graph', 'geom', 4326, 'LINESTRING', 2);

-- Load road segment edges in from the tiger edges data
INSERT INTO aro.graph (gid, statefp, countyfp, edge_type, edge_length, geom)
	SELECT	
		gid,
		statefp,
		countyfp,
		'road_segment'::text AS edge_type,
		ST_Length(ST_Transform(the_geom, 4326)),
		ST_GeometryN(ST_Transform(the_geom, 4326),1)
	FROM tiger.edges
	WHERE 
		mtfcc = 'S1640'
		OR
		mtfcc = 'S1400'
		OR
		mtfcc = 'S1630'
		OR
		mtfcc = 'S1200';

-- Add locations to graph along with lines to the closest existing road node.
INSERT INTO aro.graph
(
	edge_type,
	edge_length,
	geom
)
SELECT
	'location_link',
	ST_Length(Geography(ST_MakeLine(locations.geom, (SELECT road_nodes.geom FROM aro.road_nodes ORDER by locations.geom <-> road_nodes.geom LIMIT 1)))),
	ST_MakeLine(locations.geom, (SELECT road_nodes.geom FROM aro.road_nodes ORDER by locations.geom <-> road_nodes.geom LIMIT 1))
FROM 
	aro.locations
WHERE
	ST_Distance(locations.geog, (SELECT edges.geom FROM aro.edges ORDER by locations.geom <-> edges.geom LIMIT 1)::geography) <= 452.7
;

