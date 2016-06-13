package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.NetworkReport;
import com.altvil.aro.model.ReportType;

@Repository
public interface NetworkReportRepository extends
		JpaRepository<NetworkReport, Long> {
	
	@Query("select r from NetworkReport r where r.planId=:planId and r.reportType = :reportType") 
	NetworkReport findReport(@Param("planId") long planId, @Param("reportType") ReportType reportType) ;
	
	
	@Query(value = "delete from financial.network_report  r where r.plan_id = :planId", nativeQuery = true)
	@Modifying
	@Transactional
	void deleteReportsForPlan(@Param("planId") long planId);

	@Query(value = "insert into financial.equipment_item_cost (network_cost_code_id, network_report_id, network_node_id, atomic_count, quantity, price, total_cost)\n" + 
			"			select nt.network_code_id, hdr.id, n.id, n.atomic_count, 1, pr.price,  case when pr.atomic_counting = 1 then n.atomic_count * pr.price else pr.price end\n" + 
			"			from financial.network_report hdr\n" + 
			"			join client.network_nodes n on n.plan_id = hdr.plan_id\n" + 
			"			join financial.network_cost_code_node_type nt on nt.network_node_type_id = n.node_type_id\n" + 
			"			join financial.network_price pr on pr.id = nt.network_code_id\n" + 
			"			where hdr.id = :reportId", nativeQuery = true)
	@Modifying
	@Transactional
	void updateWireCenterEquipmentCost(@Param("reportId") long reportId);

	@Query(value = "with hdr as (\n" + 
			"select h.id, dh.id as detail_id, h.plan_id\n" + 
			"from financial.network_report h\n" + 
			"join financial.network_report dh on dh.plan_id = h.plan_id\n" + 
			"join financial.report_type rt on rt.id = dh.report_type_id and rt.\"name\" = 'detail_equipment'\n" + 
			"where h.id = :reportId\n" + 
			")\n" + 
			"insert into financial.equipment_summary_cost (network_cost_code_id, network_report_id, atomic_count, quantity, price, total_cost)\n" + 
			"	select c.network_cost_code_id, h.id, sum(c.atomic_count), sum(1), avg(c.price),  sum(c.total_cost)\n" + 
			"	from hdr h\n" + 
			"	join financial.equipment_item_cost c on c.network_report_id = h.detail_id\n" + 
			"	group by c.network_cost_code_id, h.id", nativeQuery = true)
	@Modifying
	@Transactional
	void updateWireCenterEquipmentSummary(@Param("reportId") long reportId);
	
	@Query(value = "insert into financial.fiber_summary_cost\n" + 
			"(network_cost_code_id, network_report_id, length_meters, cost_per_meter, total_cost)\n" + 
			"select ft.network_cost_code_id, hdr.id, sum(st_length(cast(geom as geography))), avg(pr.price), sum(st_length(cast(geom as geography)) * pr.price)\n" + 
			"from client.fiber_route fr\n" + 
			"join financial.network_report hdr on  hdr.plan_id = fr.plan_id\n" + 
			"join financial.network_code_fiber_type ft on ft.fiber_route_type_id = fr.fiber_route_type\n" + 
			"join financial.network_price pr on pr.id = ft.network_cost_code_id\n" + 
			"where hdr.id = :reportId\n" + 
			"group by ft.network_cost_code_id, hdr.id", nativeQuery = true)
	@Modifying
	@Transactional
	void updateWireCenterFiberSummary(@Param("reportId") long reportId);
	
	@Query(value = "with hdr as (\n" + 
			"select * from financial.network_report where id = :reportId\n" + 
			"),\n" + 
			"wire_reports as (\n" + 
			" select \n" + 
			"	dh.* \n" + 
			" from hdr h\n" + 
			" join client.plan p on p.parent_plan_id = h.plan_id\n" + 
			" join financial.network_report dh on dh.plan_id = p.id\n" + 
			" join financial.report_type rt on rt.id = dh.report_type_id and rt.name = 'summary_equipment'\n" + 
			")\n" + 
			"insert into financial.equipment_summary_cost (network_cost_code_id, network_report_id, atomic_count, quantity, price, total_cost)\n" + 
			"select c.network_cost_code_id, h.id, sum(c.atomic_count), sum(atomic_count), avg(c.price),  sum(c.total_cost) \n" + 
			"from hdr h, wire_reports wr\n" + 
			"join financial.equipment_summary_cost c on c.network_report_id = wr.id\n" + 
			"group by c.network_cost_code_id, h.id" + 
			"	", nativeQuery = true)
	@Modifying
	@Transactional
	void updateMasterPlanEquipmentSummary(@Param("reportId") long reportId);
	
	
	@Query(value = "\n" + 
			"with hdr as (\n" + 
			"select * from financial.network_report where id = :reportId\n" + 
			"),\n" + 
			"wire_reports as (\n" + 
			" select r.* \n" + 
			" from client.plan p\n" + 
			" join hdr h on h.plan_id = p.parent_plan_id\n" + 
			" join financial.network_report r on r.plan_id = p.id \n" + 
			" join financial.report_type rt on rt.\"id\" = r.report_type_id  and rt.name ='summary_fiber'\n" + 
			")\n" + 
			"insert into financial.fiber_summary_cost\n" + 
			"   (network_cost_code_id, network_report_id, length_meters, cost_per_meter, total_cost)\n" + 
			"select c.network_cost_code_id, h.id, sum(c.length_meters), avg(c.cost_per_meter), sum(c.total_cost)  \n" + 
			"from hdr h, wire_reports wr\n" + 
			"join financial.fiber_summary_cost c on c.network_report_id = wr.id\n" + 
			"group by c.network_cost_code_id, h.id	", nativeQuery = true)
	@Modifying
	@Transactional
	void updateMasterPlanFiberSummary(@Param("reportId") long reportId);
	
	

}
