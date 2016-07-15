SELECT AddGeometryColumn('temp_hh', 'households', 'geom', 4326, 'POINT', 2);

UPDATE temp_hh.households set geom = ST_SetSRID(ST_MakePoint(-lon, abs(lat)), 4326);

CREATE INDEX temp_hh_geog_gist
  ON temp_hh.households
  USING gist
  (geog);

CREATE INDEX temp_hh_geom_gist
  ON temp_hh.households
  USING gist
  (geom);