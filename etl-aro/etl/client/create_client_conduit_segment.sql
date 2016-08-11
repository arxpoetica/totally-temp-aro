--This a temporary place holder before pulling in VZ Fiber Routes

--- Create a simple buffer for fiber segments

drop table if exists geotel.buffered_routes_small cascade ;
create table geotel.buffered_routes_small as 
select gid, a.carrier_id, st_transform(st_buffer(the_geom::geography, 20)::geometry, 4326) as geom
from geotel.fiber_plant p
join geotel.carrier_alias a on a.carrier_alias = p.carrier
join geotel.carrier c on c.id = a.carrier_id
where c.is_competitor = true;

CREATE INDEX geotel_buffered_routes_small_geom_gist
  ON geotel.buffered_routes
  USING gist
  (geom);

CREATE INDEX geotel_buffered_routes_small_gid_index 
	ON geotel.buffered_routes(gid);

CREATE INDEX geotel_buffered_routes_carrier_small_id_index 
	ON geotel.buffered_routes(carrier_id);

-- create segment views
drop view if exists client.conduit_edge_segments cascade ;
create view client.conduit_edge_segments as 
select
	tlid as gid, 
	plan_id,
	6 as construction_type,
	st_length(edge::geography) as edge_length,
	st_length(segment::geography) as segment_length,
	st_line_locate_point(edge, st_startpoint(segment)) as start_ratio, 
	st_line_locate_point(edge, st_endpoint(segment)) as end_ratio
from(
	select a.tlid, r.id as plan_id, st_linemerge(a.geom) as edge, st_intersection(fr.geom, a.geom) as segment 
	from client.plan r 
	join aro.wirecenters w on r.wirecenter_id = w.id
	join aro.edges a on st_intersects(edge_buffer, a.geom)
	join geotel.buffered_routes_small fr on  st_intersects(fr.geom, a.geom)
	join geotel.carrier c on c.id = fr.carrier_id 
	and c."name" = 'ION') s ;



drop view if exists client.conduit_segment cascade ;
create view client.conduit_segment as  
select plan_id, gid, max(construction_type) as construction_type,  min(start_ratio) as start_ratio, max(end_ratio) as end_ratio
from client.conduit_edge_segments s
where s.start_ratio is not null and s.end_ratio is not null
group by plan_id, gid;


