DROP TABLE IF EXISTS boundaries.cran;

CREATE TABLE boundaries.cran
(
	id serial,
	gid int,
	name varchar
);

SELECT AddGeometryColumn('boundaries', 'cran', 'the_geom', 4326, 'MULTIPOLYGON', 2);


-- Load MO CRANs
INSERT INTO boundaries.cran(gid, name, the_geom)
	SELECT
		gid,
		name,
		the_geom
	FROM boundaries.cran_mo;

INSERT INTO boundaries.cran(gid, name, the_geom)
	SELECT
		gid,
		name,
		the_geom
	FROM boundaries.cran_wa;