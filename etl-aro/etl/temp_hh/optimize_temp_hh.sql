CREATE INDEX temp_hh_geog_gist
  ON temp_hh.households
  USING gist
  (geog)