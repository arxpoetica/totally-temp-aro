-- Table: public.aro_locations

-- DROP TABLE public.aro_locations;

CREATE TABLE public.aro_locations AS
	SELECT DISTINCT ON (ST_AsText(geog))
		-- Do we need to add our own ID as well as preserve bldgid?
		-- If we keep bldgid, they'll all be unique from infousa, but client data ids could theoretcially contain duplicates
		bldgid AS id,
		address,
		city, 
		state,
		zip AS zipcode,
		lat,
		long AS lon,
		ST_GeographyFromText(ST_AsText(geog)) AS geog
	FROM infousa_businesses
	GROUP BY id, address, city, state, zipcode, lat, lon, geog;

-- Is there a way to do this above? Would rather have this column come before geog
-- Is numeric the right data type?
ALTER TABLE public.aro_locations ADD COLUMN entry_fee numeric;

ALTER TABLE public.aro_locations ADD PRIMARY KEY (id);

ALTER TABLE public.aro_locations
  OWNER TO postgres;
GRANT ALL ON TABLE public.aro_locations TO aro;

CREATE INDEX aro_locations_geog_gist
  ON public.aro_locations
  USING gist
  (geog);