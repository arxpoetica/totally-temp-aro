DROP TABLE IF EXISTS aro.states;

CREATE TABLE aro.states (
	gid int,
	statefp varchar,
	stusps varchar,
	name varchar,
	CONSTRAINT pkey_aro_states_gid PRIMARY KEY (gid)
);

SELECT AddGeometryColumn('aro', 'states', 'geom', 4326, 'MULTIPOLYGON', 2);

DROP INDEX IF EXISTS idx_aro_edges_geom_gist;
CREATE INDEX idx_aro_edges_geom_gist ON aro.edges USING gist(geom);
