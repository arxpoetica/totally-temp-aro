TRUNCATE aro.locations CASCADE;

-- Make locations out of InfoUSA businesses (infousa.businesses)
INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geog, geom)
    SELECT DISTINCT ON (bldgid)
        address,
        city,
        b.state,
        zip AS zipcode,
        lat,
        long AS lon,
        b.geog as geog,
        b.geog::geometry as geom
    FROM businesses.infousa b
    JOIN aro.wirecenter_subset wc
        ON ST_Within(b.geog::geometry, wc.geom);

-- Make locations out of InfoGroup households (temp_hh.households)
INSERT INTO aro.locations(address, city, state, zipcode, lat, lon, geom, geog)
    SELECT DISTINCT ON (lat, lon)
        hh.address,
        hh.city,
        hh.state,
        hh.zip5,
        hh.lat,
        hh.lon,
        hh.geom,
        hh.geog
    FROM temp_hh.households hh
    JOIN aro.wirecenter_subset wc
        ON ST_Within(hh.geom, wc.geom);

