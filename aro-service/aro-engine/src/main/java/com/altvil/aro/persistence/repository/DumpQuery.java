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
	
	private static String query = "INSERT INTO client.plan_targets (location_id, plan_id)\n" + 
			"SELECT l.id, p.id \n" + 
			"FROM client.plan mp \n" + 
			"JOIN client.plan p \n" + 
			"	ON p.parent_plan_id = mp.id\n" + 
			"JOIN client.service_area sa \n" + 
			"	ON sa.id = p.wirecenter_id\n" + 
			"JOIN client.plan_targets t\n" + 
			"	ON t.plan_id = mp.id\n" + 
			"JOIN aro.locations l \n" + 
			"	ON l.id = t.location_id\n" + 
			"	AND ST_CONTAINS(sa.geom, l.geom)\n" + 
			"WHERE mp.id = :masterPlanId";
	
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
