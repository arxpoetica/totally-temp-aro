CREATE TABLE aro.splice_points
(
	id serial,
	carrier_name varchar,
	geog geography('POINT', 4326)
);

SELECT AddGeometryColumn('aro', 'splice_points', 'geom', 4326, 'POINT', 2);

CREATE INDEX aro_splice_points_geom_gist ON aro.splice_points USING gist (geom);
CREATE INDEX aro_splice_points_geog_gist ON aro.splice_points USING gist (geog);

-- Currently, we place splice points in the middle of every fiber segment greater than 500m in length.
-- We could probably do better at this, but since we don't have "real" data right now, this should be fine for testing purposes.
-- We'll preserve all carriers' splice points in the aro.splice_points table, but only one set (the '"client's") will be added to the graph and used for source selection.
INSERT INTO aro.splice_points (carrier_name, geog, geom)
	SELECT
		carrier_name,
		Geography(ST_Line_Interpolate_Point(plant.geom, 0.5)) as geog,
		ST_Line_Interpolate_Point(plant.geom, 0.5) as geom
	FROM aro.fiber_plant plant
	WHERE ST_Length(plant.geog) >= 500.0;