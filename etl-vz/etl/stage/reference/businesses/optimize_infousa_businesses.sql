CREATE INDEX ref_businesses_infousa_geog_gist ON ref_businesses.infousa USING gist (geog);
CREATE INDEX ref_businesses_infousa_sic4 ON ref_businesses.infousa USING btree (sic4);