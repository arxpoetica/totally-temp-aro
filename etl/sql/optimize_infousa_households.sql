SELECT AddGeometryColumn('infousa_hh', 'households', 'geom', 4326, 'POINT', 2);

UPDATE infousa_hh.households SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);

CREATE INDEX infousa_hh_geog_gist
  ON infousa_hh.households
  USING gist
  (geog);

CREATE INDEX infousa_hh_geom_gist
  ON temp_hh.households
  USING gist
  (geom);