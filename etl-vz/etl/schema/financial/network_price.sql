create or replace view financial.network_price as 
select ca.date_from, ca.date_to, ca.state_code, ncc.id, ncc.name, u.name as uom_name,  case when u.name='atomic_feeder_unit' then 1 else 0 end as atomic_counting,   sum(ca.cost * cd.quantity) as price
from financial.network_cost_code ncc
join financial.network_code_detail cd on cd.network_cost_code_id = ncc.id
join financial.cost_code cc on cd.cost_code_id = cc.id
join financial.cost_assignment ca on ca.cost_code_id = cc.id
join aro.uom u on cd.uom_id = u.id
group by ncc.id, ca.state_code, ca.date_from, ca.date_to, ncc.name, u.name ;
