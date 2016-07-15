drop view if exists client.location_comptitors cascade ;
create view client.location_comptitors as
select l.id, b.entity_type, r.carrier_id, 1.0 as strength
from client.classified_business b
join aro.locations l on l.id = b.location_id
join geotel.buffered_routes r on st_contains(r.geom, l.geom)
group by l.id, b.entity_type, carrier_id ;