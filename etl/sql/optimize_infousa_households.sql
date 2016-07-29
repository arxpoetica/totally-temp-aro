SELECT AddGeometryColumn('infousa', 'households', 'geom', 4326, 'POINT', 2);

UPDATE infousa.households SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);

CREATE INDEX infousa_households_geog_gist
  ON infousa.households
  USING gist
  (geog);

CREATE INDEX infousa_households_geom_gist
  ON infousa.households
  USING gist
  (geom);