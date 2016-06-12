package com.altvil.aro.persistence.repository;

import java.lang.reflect.Method;

import org.springframework.data.jpa.repository.Query;

public class DumpQuery {
	private static String METHOD = "com.altvil.aro.persistence.repository.NetworkPlanRepository.queryAllFiberDemand(long, int)";
	
	
	
	public static void main(String[] args) {
		try {
			value() ;
		} catch( Throwable err ) {
			err.printStackTrace(); 
		}
	}
	
	private static String query = "with location_ids as (\n" + 
			"	select l.id as id\n" + 
			"	from client.plan p \n" + 
			"	join aro.wirecenters w on w.id = p.wirecenter_id\n" + 
			"	join aro.locations l on st_contains(w.geom, l.geom)\n" + 
			"	where p.id = :planId\n" + 
			")\n" + 
			",\n" + 
			"fiber_model as (\n" + 
			"	select s.industry_id, s.employees_by_location_id, sum(monthly_spend) / 4 as monthly_spend\n" + 
			"	from client.spend s\n" + 
			"	where city_id = 1 and year = :year\n" + 
			"	group by industry_id, employees_by_location_id\n" + 
			"	order by industry_id, employees_by_location_id\n" + 
			")\n" + 
			",\n" + 
			"business_fiber as (\n" + 
			"	select l.id,\n" + 
			"	(case when sum(b.number_of_employees) >= 1000 then 32 else 1 end)  as fiber_count,\n" + 
			"	sum(f.monthly_spend) as monthly_spend\n" + 
			"	from location_ids l \n" + 
			"	join aro.businesses b on b.location_id = l.id \n" + 
			"	join client.employees_by_location e on (b.number_of_employees >= e.min_value) and  (b.number_of_employees <= e.max_value) \n" + 
			"	join client.industry_mapping m on m.sic4 = b.industry_id\n" + 
			"	join fiber_model f on f.industry_id = m.industry_id and f.employees_by_location_id = e.id \n" + 
			"	group by l.id\n" + 
			")\n" + 
			",\n" + 
			"celltower_fiber as (\n" + 
			"	select l.id,\n" + 
			"	sum(1) * 64  as fiber_count,\n" + 
			"	sum(1) * 500 as monthly_spend\n" + 
			"	from aro.towers t\n" + 
			"	join location_ids l on l.id = t.location_id\n" + 
			"	group by l.id\n" + 
			")\n" + 
			",\n" + 
			"household_fiber as (\n" + 
			"	select l.id, sum(case when h.number_of_households is null then 1 else h.number_of_households end) as fiber_count, \n" + 
			"	sum(case when h.number_of_households is null then 1 else h.number_of_households end) * 60 as monthly_spend\n" + 
			"	from aro.households h\n" + 
			"	join location_ids l on l.id = h.location_id\n" + 
			"	group by l.id\n" + 
			")\n" + 
			"select \n" + 
			"l.id,\n" + 
			"case when b.fiber_count is null then 0 else b.fiber_count end as business_fiber,\n" + 
			"case when b.fiber_count is null then 0 else b.monthly_spend end as business_spend,\n" + 
			"\n" + 
			"case when t.fiber_count is null then 0 else t.fiber_count end as celltower_fiber,\n" + 
			"case when t.fiber_count is null then 0 else t.monthly_spend end as celltower_spend,\n" + 
			"\n" + 
			"case when h.fiber_count is null then 0 else h.fiber_count end as household_fiber,\n" + 
			"case when h.fiber_count is null then 0 else h.monthly_spend end as household_spend\n" + 
			"\n" + 
			"from location_ids l\n" + 
			"left join business_fiber b on b.id = l.id\n" + 
			"left join celltower_fiber t on t.id = l.id\n" + 
			"left join household_fiber h on h.id = l.id\n" + 
			"limit 40000\n" + 
			"\n" ;
	
	public static void value() {
		System.out.println(query) ;
	}
	
	
	
	public static void lookup() throws ClassNotFoundException {
		int lastPeriod = METHOD.lastIndexOf('.');
		String className = METHOD.substring(0, lastPeriod);
		String methodSignature = METHOD.substring(lastPeriod + 1);
		
		Class<?> cls = Class.forName(className);
		for(Method method : cls.getDeclaredMethods()) {
			StringBuilder key = new StringBuilder();
			key.append(method.getName()).append('(');
			Class<?>[] pt = method.getParameterTypes();
			if (pt.length > 0) {
				key.append(pt[0]);
				
				for(int i = 1; i < pt.length; i++) {
					key.append(',').append(pt[i]);
				}
			}
			key.append(')');
			
			if (methodSignature.equals(key.toString())) {
				System.out.println(method.getAnnotation(Query.class).value());
			}
		}
	}
}
