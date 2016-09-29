DROP TABLE IF EXISTS aro.states;

CREATE TABLE aro.states (
	gid int,
	statefp varchar,
	stusps varchar,
	name varchar,
	CONSTRAINT pkey_aro_states_gid PRIMARY KEY (gid)
);

SELECT AddGeometryColumn('aro', 'states', 'geom', 4326, 'MULTIPOLYGON', 2);

CREATE INDEX idx_aro_states_geom_gist ON aro.states USING gist(geom);
CREATE INDEX idx_aro_states_stusps ON aro.states (stusps);
CREATE INDEX idx_aro_states_statefp ON aro.states (statefp);
