package com.altvil.aro.persistence.repository;

public class DumpQuery {
	
	private static String QUERY  = "with location_ids as (\n" + 
			"	select location_id as id from \n" + 
			"	client.plan_targets \n" + 
			"	where plan_id = :planId \n" + 
			")\n" + 
			",\n" + 
			"fiber_model as (\n" + 
			"	select s.industry_id, s.employees_by_location_id, ceil(sum(monthly_spend) / 65) as fiber_count\n" + 
			"	from client.spend s\n" + 
			"	where city_id = 1 and year = 2012\n" + 
			"	group by industry_id, employees_by_location_id\n" + 
			"	order by industry_id, employees_by_location_id\n" + 
			")\n" + 
			",\n" + 
			"business_fiber as (\n" + 
			"	select l.id, f.fiber_count\n" + 
			"	from location_ids l \n" + 
			"	join aro.businesses b on b.location_id = l.id \n" + 
			"	join client.employees_by_location e on (b.number_of_employees >= e.min_value) and  (b.number_of_employees <= e.max_value) \n" + 
			"	join client.industry_mapping m on m.sic4 = b.industry_id\n" + 
			"	join fiber_model f on f.industry_id = m.industry_id and f.employees_by_location_id = e.id \n" + 
			")\n" + 
			",\n" + 
			"celltower_fiber as (\n" + 
			"	select l.id, sum(1) * 256 as fiber_count\n" + 
			"	from aro.towers t\n" + 
			"	join location_ids l on l.id = t.location_id\n" + 
			"	group by l.id\n" + 
			")\n" + 
			",\n" + 
			"household_fiber as (\n" + 
			"	select l.id, sum(case when h.number_of_households is null then 1 else h.number_of_households end) as fiber_count\n" + 
			"	from aro.households h\n" + 
			"	join location_ids l on l.id = h.location_id\n" + 
			"	group by l.id\n" + 
			")\n" + 
			"select \n" + 
			"l.id,\n" + 
			"case when b.fiber_count is null then 0 else b.fiber_count end as business_fiber,\n" + 
			"case when t.fiber_count is null then 0 else t.fiber_count end as celltower_fiber,\n" + 
			"case when h.fiber_count is null then 0 else h.fiber_count end as household_fiber\n" + 
			"from location_ids l\n" + 
			"left join business_fiber b on b.id = l.id\n" + 
			"left join celltower_fiber t on t.id = l.id\n" + 
			"left join household_fiber h on h.id = l.id ";
	
	
	public static void main(String[] args) {
		System.out.println(QUERY) ;
	}
	

}
