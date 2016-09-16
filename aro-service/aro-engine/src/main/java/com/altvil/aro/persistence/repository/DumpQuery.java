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
	
	private static String query = "WITH selected_master AS (\n" + 
			"	SELECT p.*\n" + 
			"	FROM client.plan p\n" + 
			"	WHERE p.id = :inputMasterPlan\n" + 
			")\n" + 
			",\n" + 
			"all_fiber AS (\n" + 
			"	SELECT\n" + 
			"		id,\n" + 
			"		ST_Union(f.geom) AS geom\n" + 
			"	FROM (\n" + 
			"	(SELECT mp.id, pc.geom\n" + 
			"	FROM selected_master mp\n" + 
			"	JOIN client.plan_fiber_conduit pc\n" + 
			"		ON pc.plan_id = mp.id)\n" + 
			"\n" + 
			"		UNION\n" + 
			"\n" + 
			"	(SELECT mp.id, pc.geom\n" + 
			"	FROM selected_master mp\n" + 
			"	JOIN client.plan_fiber_conduit pc\n" + 
			"		ON pc.plan_id = mp.id)\n" + 
			"	) AS f\n" + 
			"	GROUP BY id\n" + 
			")\n" + 
			"INSERT INTO client.plan_fiber_conduit\n" + 
			"	(:planId, geom)\n" + 
			"SELECT id, geom \n" + 
			"FROM all_fiber";
	
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
