drop table if exists geotel.buffered_routes cascade ;
create table geotel.buffered_routes as 
select gid, a.carrier_id, st_transform(st_buffer(the_geom::geography, 200)::geometry, 4326) as geom
from geotel.fiber_plant p
join geotel.carrier_alias a on a.carrier_alias = p.carrier
join geotel.carrier c on c.id = a.carrier_id
where c.is_competitor = true;

CREATE INDEX geotel_buffered_routes_geom_gist
  ON geotel.buffered_routes
  USING gist
  (geom);

CREATE INDEX geotel_buffered_routes_gid_index 
	ON geotel.buffered_routes(gid);

CREATE INDEX geotel_buffered_routes_carrier_id_index 
	ON geotel.buffered_routes(carrier_id);