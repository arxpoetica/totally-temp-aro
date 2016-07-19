CREATE INDEX infousa_businesses_geog_gist ON infousa.businesses USING gist (geog);
CREATE INDEX infousa_businesses_sic4 ON infousa.businesses USING btree (sic4);