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
	
	private static String query = "WITH selected_service_layer AS (\n" +
			"	SELECT *\n" +
			"	FROM client.service_layer \n" +
			"	WHERE id = :serviceLayerId\n" +
			")\n" +
			",\n" +
			"user_towers as(\n" +
			" SELECT nextval(cast ('aro.locations_id_seq' as regclass)) as location_id,  nextval(cast ('aro.towers_id_seq' as regclass)) as tower_id, sle.*, st.statefp \n" +
			" FROM selected_service_layer sl\n" +
			"	user_data.source_location_entity sle on sle.data_source_id = sl.data_source_id\n" +
			"    inner join aro.states st\n" +
			"    on\n" +
			"        ST_CONTAINS(st.geom, sle.point)\n" +
			"        and sle.location_class = 2     \n" +
			"        and sle.entity_category_id = 5     \n" +
			")\n" +
			",\n" +
			"locations AS (\n" +
			"    INSERT INTO aro.locations(\n" +
			"      id, \n" +
			"      state,\n" +
			"      lat,\n" +
			"      lon,\n" +
			"      geog,\n" +
			"      total_towers,\n" +
			"      geom),\n" +
			"    ) select location_id, statefp, lat, \"long\", cast(point as geography), 1, point  from user_towers ut\n" +
			")    \n" +
			"INSERT INTO aro.towers ( \n" +
			" id,\n" +
			"  location_id,\n" +
			"  parcel_state,\n" +
			"  lat,\n" +
			"  lon,\n" +
			"  geog,\n" +
			"  geom,\n" +
			"  data_source_id, --integer\n" +
			" attributes " +
			"  )\n" +
			"SELECT \n" +
			"	tower_id,\n" +
			"	statefp,\n" +
			"	lat,\n" +
			"	\"long\",\n" +
			"	cast(point as geography),\n" +
			"	point, " +
			"data_source_id," +
			"custom_attributes \n" +
			"FROM user_towers ut\n";
	
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
