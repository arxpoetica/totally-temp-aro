CREATE INDEX infousa_businesses_geog_gist ON businesses.infousa USING gist (geog);
CREATE INDEX infousa_businesses_sic4 ON businesses.infousa USING btree (sic4);