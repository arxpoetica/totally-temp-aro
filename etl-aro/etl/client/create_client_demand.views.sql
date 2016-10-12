drop view if exists client.classified_business cascade ;
create view client.classified_business as 
select 
b.*, 
c.id as entity_type,
e.id as employee_count_id,
m.industry_id as industry_cat_id
from aro.businesses b
join client.business_categories c on b.number_of_employees >= c.min_value and  b.number_of_employees < c.max_value
join client.employees_by_location e on (b.number_of_employees >= e.min_value) and  (b.number_of_employees <= e.max_value) 
join client.industry_mapping m on m.sic4 = b.industry_id ;

drop view if exists client.spend_summary cascade ;
CREATE VIEW client.spend_summary AS
 SELECT s.city_id,
    s.year,
    s.industry_id,
    s.employees_by_location_id,
    (pow( abs(sum(s.monthly_spend)-50), 0.85 )+ 50) ::numeric AS monthly_spend
   FROM client.spend s
   inner join client.products p
   on p.id = s.product_id
   where p.product_type = 'Wireline Data'
  GROUP BY s.city_id, s.year, s.industry_id, s.employees_by_location_id;

drop view if exists client.business_summary cascade ;
create view client.business_summary as 
select city_id, year, b.location_id, b.entity_type, sum(s.monthly_spend) as monthly_spend, count(1) as count 
from client.classified_business b
join client.spend_summary s on s.employees_by_location_id = b.employee_count_id and s.industry_id = b.industry_cat_id
group by city_id, year, b.location_id, b.entity_type ;

drop view if exists client.households_summary ;
create view client.households_summary as 
select location_id,
sum(case when h.number_of_households is null then 1 else h.number_of_households end) as count
from aro.households h
group by location_id ;

drop view if exists client.celltower_summary ;
create view client.celltower_summary as 
select location_id,
sum(1) as count
from aro.towers t
group by location_id ;