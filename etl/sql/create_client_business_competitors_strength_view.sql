drop view if exists client.summarized_competitors_strength  cascade ;
create view client.summarize_competitors_strength as
select c.location_id, c.entity_type, sum(strength) as strength
from client.location_competitors c
group by  c.entity_type, c.location_id;