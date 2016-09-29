TRUNCATE aro.states CASCADE;

INSERT INTO aro.states (gid, statefp, stusps, name, geom)
SELECT
	gid,
	statefp,
	stusps,
	name,
	the_geom
FROM tiger_data.state;