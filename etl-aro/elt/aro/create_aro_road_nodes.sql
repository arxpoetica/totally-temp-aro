-- Table: aro.road_nodes

-- DROP TABLE aro.road_nodes;

-- First, create a builder table that aggregates all the nodes that are "from" nodes on edges
CREATE TEMP TABLE road_nodes_builder AS
SELECT
		tnidf AS tnid,
		max (tlid) AS tlid,
		'F'::text AS source
FROM 
		tiger.edges
GROUP BY tnidf;


-- Insert all the "to" nodes into the builder table as well
INSERT INTO road_nodes_builder
(
	tnid,
	tlid,
	source
)
SELECT
	tnidt,
	max(tlid),
	'T'::text
FROM tiger.edges segments
WHERE NOT EXISTS (SELECT 1 from road_nodes_builder WHERE segments.tnidt = road_nodes_builder.tnid)
GROUP BY tnidt;


-- Create empty road_nodes table
CREATE TABLE aro.road_nodes 
(
	id serial,
	tnid NUMERIC(10,0),
	coordinates geography(Point, 4326)
);

SELECT AddGeometryColumn('aro', 'road_nodes', 'geom', 4326, 'POINT', 2);

-- Populate the road_nodes table from the builder table
INSERT INTO aro.road_nodes
(
	tnid,
	coordinates,
	geom
)
SELECT
	tnid,
	CASE source
		WHEN 'F' THEN
			ST_StartPoint(ST_GeometryN(ST_Transform(seg.the_geom, 4326), 1))
		WHEN 'T' THEN
			ST_EndPoint(ST_GeometryN(ST_Transform(seg.the_geom, 4326), 1))
	END AS coordinates,
	CASE source
		WHEN 'F' THEN
			ST_StartPoint(ST_GeometryN(ST_Transform(seg.the_geom, 4326), 1))
		WHEN 'T' THEN
			ST_EndPoint(ST_GeometryN(ST_Transform(seg.the_geom, 4326), 1))
	END AS geom
FROM
	road_nodes_builder builder 
JOIN
	tiger.edges seg 
ON
	builder.tlid = seg.tlid
WHERE 
	NOT EXISTS (
		SELECT 1 FROM road_nodes WHERE builder.tnid = road_nodes.tnid
	)
;

-- Using geometry and geography for now until we can determine if one allows us to cast less frequently and speed things up.
CREATE INDEX aro_road_node_coordinates_gist ON aro.road_nodes USING gist(coordinates);
CREATE INDEX aro_road_node_geom_gist ON aro.road_nodes USING gist(geom);

VACUUM ANALYZE aro.road_nodes;