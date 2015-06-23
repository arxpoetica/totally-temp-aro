-- Table: public.aro_edges

-- DROP TABLE public.aro_edges;

CREATE TABLE aro.edges AS
	SELECT
		gid,
		statefp,
		countyfp,
		tlid,
		tfidl,
		tfidr,
		fullname,
		lfromadd,
		ltoadd,
		rfromadd,
		rtoadd,
		zipl,
		zipr,
		tnidf,
		tnidt,
		ST_Length(the_geom) as length,
		the_geom AS geom
	FROM tiger.edges
	WHERE featcat = 'S';


ALTER TABLE aro.edges
  ADD CONSTRAINT pk_aro_edges PRIMARY KEY (gid);

CREATE INDEX aro_edges_geom_gist
  ON aro.edges
  USING gist
  (geom);