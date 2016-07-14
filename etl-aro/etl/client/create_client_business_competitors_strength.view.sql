drop view if exists client.business_competitors_strength  cascade ;
create view client.business_competitors_strength as
select c.id, sum(strength) as strength
from client.location_comptitors c
where c.entity_type = 3 
group by c.id;