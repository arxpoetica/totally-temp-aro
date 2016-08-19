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
	
	private static String query = "with inputs as (\n" + 
			" select p.id as master_plan_id, p.* \n" + 
			" from client.plan p where p.id = :planId\n" + 
			")\n" + 
			",\n" + 
			"original_targets as (\n" + 
			" select pt.id, pt.location_id, pt.plan_id, mp.master_plan_id, wp.wirecenter_id\n" + 
			" from inputs mp\n" + 
			" join client.plan wp on wp.parent_plan_id = mp.id\n" + 
			" join client.plan_targets pt on pt.plan_id = wp.id\n" + 
			")\n" + 
			",\n" + 
			"selected_targets as (\n" + 
			"	select mt.location_id, ot.plan_id, mp.master_plan_id, ot.wirecenter_id\n" + 
			"	from inputs mp\n" + 
			"	join client.plan_targets mt on mt.plan_id = mp.id and mt.plan_id = mp.id\n" + 
			"	left join original_targets ot on ot.location_id = mt.location_id \n" + 
			")\n" + 
			",\n" + 
			"new_targets as (\n" + 
			"	select st.location_id, st.master_plan_id, w.id as wirecenter_id  \n" + 
			"	from selected_targets st \n" + 
			"	join aro.locations l on l.id = st.location_id\n" + 
			"	join aro.wirecenters w on st_contains(w.geom, l.geom) and service_type='A' and layer_id=:layerId\n" + //Add Layer Constraint
			"	where st.plan_id is null\n" + 
			")\n" + 
			"\n" + 
			",\n" + 
			"deleted_locations as (\n" + 
			"	select ot.location_id, ot.plan_id, ot.master_plan_id, ot.wirecenter_id\n" + 
			"	from original_targets ot\n" + 
			"	left join selected_targets st on st.location_id = ot.location_id and st.plan_id = ot.plan_id\n" + 
			"	where st.location_id is null \n" + 
			")\n" + 
			",\n" + 
			"new_plans as (\n" + 
			"	insert into client.plan (name, plan_type, wirecenter_id, area_name, area_centroid, area_bounds, created_at, updated_at, parent_plan_id)\n" + 
			"	select p.name, 'W', w.id, w.wirecenter, st_centroid(w.geom), w.geom,  NOW(), NOW(), p.master_plan_id \n" + 
			"	from\n" + 
			"	inputs p,\n" + 
			"	(select distinct nt.master_plan_id, nt.wirecenter_id\n" + 
			"		from new_targets nt\n" + 
			"		join aro.wirecenters w on w.id = nt.wirecenter_id) nw\n" + 
			"	join aro.wirecenters w on w.id = nw.wirecenter_id\n" + 
			"	returning id, parent_plan_id as master_plan_id, wirecenter_id, area_centroid \n" + 
			")\n" + 
			",\n" + 
			"updated_new_cos as ( \n" + 
			"			select \n" + 
			"			\n" + 
			"			pl.id,\n" + 
			"			\n" + 
			"			(select np.area_centroid\n" + 
			"			from new_plans np \n" + 
			"			join aro.wirecenters w on w.id = np.wirecenter_id\n" + 
			"			and np.id = pl.id) as centroid,\n" + 
			"			\n" + 
			"			(select\n" + 
			"			CO.geom\n" + 
			"			from new_plans np\n" + 
			"			join aro.wirecenters w on w.id = np.wirecenter_id\n" + 
			"			join client.network_nodes CO on st_contains(w.geom, CO.geom) \n" + 
			"			where CO.plan_id is null\n" + 
			"			and np.id = pl.id) as location\n" + 
			"			from new_plans pl 			\n" + 
			"	)\n" + 
			",\n" + 
			"updated_network_nodes as (\n" + 
			"	insert into client.network_nodes (plan_id, node_type_id, geog, geom)\n" + 
			"	 select co.id, 1,\n" + 
			"		case\n" + 
			"		when co.location is not null then cast(co.location as geography)\n" + 
			"		else cast(co.centroid as geography)\n" + 
			"		end,\n" + 
			"		case\n" + 
			"		when co.location is not null then cast(co.location as geometry)\n" + 
			"		else cast(co.centroid  as geometry)\n" + 
			"		end\n" + 
			"		from  updated_new_cos co\n" + 
			"	returning id, plan_id\n" + 
			")\n" + 
			",\n" + 
			"updated_plan_sources as (\n" + 
			"	insert into client.plan_sources (network_node_id, plan_id)\n" + 
			"	select id, plan_id from updated_network_nodes	\n" + 
			")\n" + 
			",\n" + 
			"update_plan_targets as (\n" + 
			"	insert into client.plan_targets (location_id, plan_id)\n" + 
			"	select nt.location_id, nt.plan_id\n" + 
			"	from selected_targets nt\n" + 
			"	where nt.plan_id is not null\n" + 
			"	returning id, plan_id\n" + 
			")\n" + 
			",\n" + 
			"updated_new_plan_targets as (	\n" + 
			"	insert into client.plan_targets (location_id, plan_id)\n" + 
			"	select nt.location_id, p.id\n" + 
			"	from new_plans p \n" + 
			"	join new_targets nt on nt.wirecenter_id = p.wirecenter_id\n" + 
			"	returning id, plan_id\n" + 
			")\n" + 
			",\n" + 
			"updated_deleted_targets as (\n" + 
			"	delete from client.plan_targets \n" + 
			"	where id in (select id from deleted_locations)\n" + 
			"	returning id \n" + 
			")\n" + 
			",\n" + 
			"old_plans as (\n" + 
			"	select plan_id, sum(location_id) as location_count\n" + 
			"	from deleted_locations\n" + 
			"	group by plan_id\n" + 
			")\n" + 
			",\n" + 
			"deleted_plans as (\n" + 
			"	delete from client.plan where id in (select plan_id from old_plans where location_count = 0)\n" + 
			"	returning id \n" + 
			")\n" + 
			",\n" + 
			"all_modified_plans as (\n" + 
			"select distinct p.plan_id \n" + 
			"from (\n" + 
			"(select distinct plan_id from update_plan_targets)\n" + 
			"union\n" + 
			"(select distinct plan_id from updated_new_plan_targets)\n" + 
			"union\n" + 
			"(select plan_id from old_plans where location_count > 0 )) p\n" + 
			")\n" + 
			",\n" + 
			"deleted_network_nodes as (\n" + 
			"	delete from client.network_nodes where plan_id in (select plan_id from all_modified_plans) and node_type_id != 1\n" + 
			"	returning id\n" + 
			")\n" + 
			",\n" + 
			"deleted_fiber_routes as (\n" + 
			"	delete from client.fiber_route where plan_id \n" + 
			"		in (select plan_id from all_modified_plans)\n" + 
			"	returning id\n" + 
			")\n" + 
			"select plan_id from all_modified_plans\n" ;
	
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
