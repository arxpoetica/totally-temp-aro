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
	
	private static String query = "WITH  selected_segs AS (\n" + 
			" 	select s.gid, s.construction_type, start_ratio, end_ratio\n" + 
			" 	FROM client.conduit_edge_segments s\n" + 
			"   WHERE s.start_ratio IS NOT NULL AND s.end_ratio IS NOT NULL and s.plan_id = :planId\n" + 
			")\n" + 
			"SELECT  \n" + 
			"    gid, \n" + 
			"    MAX(construction_type) AS construction_type,  \n" + 
			"    MIN(start_ratio) AS start_ratio, \n" + 
			"    MAX(end_ratio) AS end_ratio\n" + 
			"FROM selected_segs s\n" + 
			"GROUP BY gid";
	
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
