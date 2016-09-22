DROP TABLE IF EXISTS boundaries.cran;

CREATE TABLE boundaries.cran
(
	id serial,
	gid int,
	name varchar
);

SELECT AddGeometryColumn('boundaries', 'cran', 'the_geom', 4326, 'MULTIPOLYGON', 2);

INSERT INTO boundaries.cran(gid, name, the_geom)
	SELECT
		gid,
		gid::varchar,
		the_geom
	FROM boundaries.cran_wi_v2;

INSERT INTO boundaries.cran(gid, name, the_geom)
	SELECT
		gid,
		gid::varchar,
		the_geom
	FROM boundaries.cran_il;

INSERT INTO boundaries.cran(gid, name, the_geom)
	SELECT
		gid,
		gid::varchar,
		the_geom
	FROM boundaries.cran_wa_v2;

INSERT INTO boundaries.cran(gid, name, the_geom)
	SELECT
		gid,
		gid::varchar,
		the_geom
	FROM boundaries.cran_mo;