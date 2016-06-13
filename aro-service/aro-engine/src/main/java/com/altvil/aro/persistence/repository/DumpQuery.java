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
	
	private static String query = "with hdr as (\n" + 
			"select * from financial.network_report where id = :reportId\n" + 
			"),\n" + 
			"wire_reports as (\n" + 
			" select h.* \n" + 
			" from client.plan p\n" + 
			" join hdr h on h.plan_id = p.parent_plan_id\n" + 
			")\n" + 
			"insert into financial.equipment_summary_cost (network_cost_code_id, network_report_id, atomic_count, quantity, price, total_cost)\n" + 
			"select c.network_cost_code_id, h.id, sum(c.atomic_count), sum(1), avg(c.price),  sum(c.total_cost) \n" + 
			"from hdr h, wire_reports wr\n" + 
			"join financial.equipment_item_cost c on c.network_report_id = wr.id\n" + 
			"group by c.network_cost_code_id, h.id\n" ;
	
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
