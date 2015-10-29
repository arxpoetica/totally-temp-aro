-- Table: aro.road_nodes

DROP TABLE IF EXISTS aro.road_nodes;

CREATE TABLE aro.road_nodes 
(
	id serial,
	tnid NUMERIC(10,0),
	coordinates geography(Point, 4326)
);

SELECT AddGeometryColumn('aro', 'road_nodes', 'geom', 4326, 'POINT', 2);

-- Using geometry and geography for now until we can determine if one allows us to cast less frequently and speed things up.
CREATE INDEX aro_road_node_coordinates_gist ON aro.road_nodes USING gist(coordinates);
CREATE INDEX aro_road_node_geom_gist ON aro.road_nodes USING gist(geom);

VACUUM ANALYZE aro.road_nodes;