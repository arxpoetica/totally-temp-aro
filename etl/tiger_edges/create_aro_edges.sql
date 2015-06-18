-- Table: public.aro_edges

-- DROP TABLE public.aro_edges;

CREATE TABLE public.aro_edges AS
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
		ST_Length(geom) as length,
		geom
	FROM tiger_edges
	WHERE featcat = 'S';

ALTER TABLE public.aro_edges
  OWNER TO postgres;
GRANT ALL ON TABLE public.aro_edges TO aro;

CREATE INDEX aro_edges_geom_gist
  ON public.aro_edges
  USING gist
  (geom);