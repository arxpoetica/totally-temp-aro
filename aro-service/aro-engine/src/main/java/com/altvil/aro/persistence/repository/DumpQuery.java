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
	
	private static String query = "with selected_locations as (\n" + 
			"select l.id, b.gid as block_id\n" + 
			"	from client.plan p \n" + 
			"	join aro.wirecenters w on w.id = p.wirecenter_id\n" + 
			"	join aro.locations l on st_contains(w.geom, l.geom)\n" + 
			"	join aro.census_blocks b on st_contains(b.geom, l.geom)\n" + 
			"	where p.id =  :planId\n" + 
			"),\n" + 
			"bs as (\n" + 
			"  select l.id, l.block_id, entity_type, e.count, e.monthly_spend \n" + 
			"  from selected_locations l\n" + 
			"  join client.business_summary e on e.location_id = l.id\n" + 
			"   where year = :year and city_id = 1\n" + 
			"),\n" + 
			"hs as (\n" + 
			"  select l.id, l.block_id, 4 as entity_type, e.count, e.count*60 as monthly_spend \n" + 
			"  from selected_locations l\n" + 
			"  join client.households_summary e on e.location_id = l.id\n" + 
			"),\n" + 
			"ct as (\n" + 
			"  select l.id, l.block_id, 5 as entity_type, e.count, e.count*500 as monthly_spend \n" + 
			"  from selected_locations l\n" + 
			"  join client.celltower_summary e on e.location_id = l.id\n" + 
			")\n" + 
			"select * from  bs\n" + 
			"UNION\n" + 
			"select * from  hs\n" + 
			"UNION\n" + 
			"select * from ct\n" +
			"limit 60000" ;
	
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
