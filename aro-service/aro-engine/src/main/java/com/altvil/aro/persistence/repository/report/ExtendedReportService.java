package com.altvil.aro.persistence.repository.report;

import java.io.IOException;
import java.io.Writer;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.query.QueryExecutor;

@Service
public class ExtendedReportService {

	@Autowired
	private QueryExecutor queryExecutor;

	private Map<String, String> sqlQueryMap = new HashMap<>();

	private String getSqlQuery(String reportName) {
		String sql = sqlQueryMap.get(reportName.toLowerCase());
		if (sql == null) {
			throw new RuntimeException("Unknown Report : " + reportName);
		}

		return sql;
	}

	public void queryReport(String reportName, long planId, Writer writer)
			throws SQLException, IOException {
		queryExecutor.queryAsCsv(getSqlQuery(reportName), writer,
				ps -> ps.setLong(1, planId));
	}

	@PostConstruct
	void postConstruct() {
		sqlQueryMap.put("tabc", "WITH wp_plan AS (\n" + 
				"SELECT wp.id\n" + 
				"FROM client.plan rp\n" + 
				"JOIN client.plan mp ON rp.id = mp.parent_plan_id\n" + 
				"JOIN client.plan wp ON mp.id = wp.parent_plan_id\n" + 
				"WHERE rp.id = ?\n" + 
				"),\n" + 
				"\n" + 
				"g_plan AS (\n" + 
				"SELECT name, gp.id\n" + 
				"FROM client.plan gp\n" + 
				"JOIN wp_plan wp ON gp.parent_plan_id = wp.id\n" + 
				"),\n" + 
				"\n" + 
				"service_area_ids AS (\n" + 
				"SELECT wirecenter_id\n" + 
				"FROM wp_plan wp\n" + 
				"JOIN client.plan p ON wp.id = p.id\n" + 
				"),\n" + 
				"\n" + 
				"--towers\n" + 
				"intermediate_towers AS (\n" + 
				"SELECT DISTINCT\n" + 
				"  p.attr, \n" + 
				"  (CASE\n" + 
				"    WHEN t.attribute -> 'type' IN ('Towers (current)','Towers (planned)','Small Cells (current)','Small Cells (planned)') THEN t.attribute -> 'type' \n" + 
				"    ELSE 'Towers (undefined)'\n" + 
				"    END\n" + 
				"  ) as type,\n" + 
				"  t.id,\n" + 
				"  linking_state_id\n" + 
				"FROM wp_plan wp\n" + 
				"JOIN client.plan_location_link p ON wp.id = p.plan_id\n" + 
				"JOIN aro.towers t ON p.location_id = t.location_id\n" + 
				"),\n" + 
				"\n" + 
				"detailed_towers AS (\n" + 
				"SELECT \n" + 
				"  attr, \n" + 
				"  type,\n" + 
				"  COUNT(*)\n" + 
				"FROM intermediate_towers\n" + 
				"WHERE linking_state_id = 1\n" + 
				"GROUP BY attr, type\n" + 
				"),\n" + 
				"\n" + 
				"--tam businesses\n" + 
				"tam_biz AS (\n" + 
				"SELECT DISTINCT\n" + 
				"  p.attr,\n" + 
				"  t.id,\n" + 
				"  t.location_id,\n" + 
				"  t.number_of_employees,\n" + 
				"  CASE\n" + 
				"    WHEN number_of_employees = 1 THEN 'TAM Business XS (1 emp)'\n" + 
				"    WHEN number_of_employees >= 2 AND number_of_employees <= 24 THEN 'TAM Business S (2-24 emp)'\n" + 
				"    WHEN number_of_employees >= 25 AND number_of_employees <= 49 THEN 'TAM Business M (25-49 emp)'\n" + 
				"    WHEN number_of_employees >= 50 AND number_of_employees <= 99 THEN 'TAM Business L (50-99 emp)'\n" + 
				"    WHEN number_of_employees >= 100 THEN 'TAM Business XL (100+ emp)'\n" + 
				"    END as tam_category\n" + 
				"FROM wp_plan wp\n" + 
				"JOIN client.plan_location_link p ON wp.id = p.plan_id \n" + 
				"JOIN aro.businesses t ON p.location_id = t.location_id\n" + 
				"WHERE t.source = 'tam'\n" + 
				"  AND number_of_employees > 0),\n" + 
				"\n" + 
				"count_tam_biz AS (\n" + 
				"SELECT\n" + 
				"  attr, tam_category, COUNT(*)\n" + 
				"FROM tam_biz\n" + 
				"GROUP BY attr, tam_category\n" + 
				"),\n" + 
				"\n" + 
				"--tam buildings\n" + 
				"building_sum AS (\n" + 
				"SELECT attr, location_id, SUM(number_of_employees) as number_of_employees\n" + 
				"FROM tam_biz\n" + 
				"GROUP BY attr, location_id\n" + 
				"),\n" + 
				"\n" + 
				"building_cat AS (\n" + 
				"SELECT \n" + 
				"  attr,\n" + 
				"  CASE\n" + 
				"    WHEN number_of_employees = 1 THEN 'TAM Building XS (1 emp)'\n" + 
				"    WHEN number_of_employees >= 2 AND number_of_employees <= 24 THEN 'TAM Building S (2-24 emp)'\n" + 
				"    WHEN number_of_employees >= 25 AND number_of_employees <= 49 THEN 'TAM Building M (25-49 emp)'\n" + 
				"    WHEN number_of_employees >= 50 AND number_of_employees <= 99 THEN 'TAM Building L (50-99 emp)'\n" + 
				"    WHEN number_of_employees >= 100 THEN 'TAM Building XL (100+ emp)'\n" + 
				"    END as tam_category\n" + 
				"FROM building_sum),\n" + 
				"\n" + 
				"tam_building_cat_sum AS (\n" + 
				"SELECT attr, tam_category, COUNT(*)\n" + 
				"FROM building_cat\n" + 
				"WHERE tam_category IS NOT NULL\n" + 
				"GROUP BY attr, tam_category\n" + 
				"),\n" + 
				"\n" + 
				"--2kplus\n" + 
				"mrc_only AS (\n" + 
				"SELECT DISTINCT p.attr, t.id, t.location_id, monthly_recurring_cost\n" + 
				"FROM wp_plan wp\n" + 
				"JOIN client.plan_location_link p ON wp.id = p.plan_id\n" + 
				"JOIN aro.businesses t ON p.location_id = t.location_id\n" + 
				"WHERE source = 'vz_customers'\n" + 
				"),\n" + 
				"\n" + 
				"vzb_buildings AS (\n" + 
				"SELECT attr, '# buildings'::varchar, COUNT(DISTINCT id)\n" + 
				"FROM mrc_only\n" + 
				"GROUP BY attr\n" + 
				"),\n" + 
				"\n" + 
				"vzb_total_mrc AS (\n" + 
				"SELECT attr, 'Total MRC'::varchar, SUM(monthly_recurring_cost)\n" + 
				"FROM mrc_only\n" + 
				"GROUP BY attr\n" + 
				"),\n" + 
				"\n" + 
				"--Hubs\n" + 
				"hubs AS (\n" + 
				"SELECT 'TABC'::varchar, 'Hubs (current)'::varchar, COUNT(*)\n" + 
				"FROM wp_plan wp\n" + 
				"JOIN client.plan p ON wp.id = p.id\n" + 
				"JOIN client.plan hp ON p.wirecenter_id = hp.wirecenter_id AND hp.plan_type = 'H'\n" + 
				"JOIN client.network_nodes n ON hp.id = n.plan_id\n" + 
				"WHERE node_type_id = 1\n" + 
				"),\n" + 
				"\n" + 
				"--Businesses total output\n" + 
				"total_tam_cust AS (\n" + 
				"SELECT 'TABC'::varchar, 'TAM businesses total'::varchar AS metric, COUNT(*)\n" + 
				"FROM aro.businesses bt\n" + 
				"JOIN client.service_area sa ON ST_Contains(sa.geom, bt.geom)\n" + 
				"WHERE sa.id IN (\n" + 
				"    SELECT *\n" + 
				"    FROM service_area_ids\n" + 
				"    )\n" + 
				"  AND source = 'tam'\n" + 
				"  --maybe use state partition if going slowly\n" + 
				"),\n" + 
				"total_tam_buildings AS (\n" + 
				"SELECT 'TABC'::varchar, 'TAM buildings total'::varchar AS metric, COUNT( DISTINCT location_id)\n" + 
				"FROM aro.businesses bt\n" + 
				"JOIN client.service_area sa ON ST_Contains(sa.geom, bt.geom)\n" + 
				"WHERE sa.id IN (\n" + 
				"    SELECT *\n" + 
				"    FROM service_area_ids\n" + 
				"    )\n" + 
				"  AND source = 'tam'\n" + 
				"  --maybe use state partition if going slowly\n" + 
				"),\n" + 
				"total_vz_cust_2k AS (\n" + 
				"SELECT 'TABC'::varchar, 'VZB buildings with >$2,000 monthly spend'::varchar AS metric, COUNT( DISTINCT location_id)\n" + 
				"FROM aro.businesses bt\n" + 
				"JOIN client.service_area sa ON ST_Contains(sa.geom, bt.geom)\n" + 
				"WHERE sa.id IN (\n" + 
				"    SELECT *\n" + 
				"    FROM service_area_ids\n" + 
				"    )\n" + 
				"  AND source = 'vz_customers'\n" + 
				"  AND monthly_recurring_cost >= 2000\n" + 
				"  --maybe use state partition if going slowly\n" + 
				"),\n" + 
				"\n" + 
				"--total tower information\n" + 
				"unrouted_towers AS (\n" + 
				"SELECT attr, 'Towers Inside Bounds but Not Routed'::varchar, COUNT(*)\n" + 
				"FROM intermediate_towers\n" + 
				"WHERE linking_state_id IN (2,3)\n" + 
				"GROUP BY attr\n" + 
				"),\n" + 
				"\n" + 
				"routed_towers AS (\n" + 
				"SELECT attr, 'Routed Towers'::varchar, COUNT(*)\n" + 
				"FROM intermediate_towers\n" + 
				"WHERE linking_state_id IN (1)\n" + 
				"GROUP BY attr\n" + 
				"),\n" + 
				"\n" + 
				"--existing mileage summary\n" + 
				"existing_miles AS (\n" + 
				"SELECT 'TABC'::varchar, 'Miles of Existing Fiber'::varchar, SUM(ST_Length(ST_Intersection(sa.geom,f.geom)::geography))/1609.34\n" + 
				"FROM service_area_ids a\n" + 
				"JOIN client.service_area sa ON sa.id = a.wirecenter_id\n" + 
				"JOIN client.existing_fiber f ON ST_Intersects(sa.geom, f.geom)\n" + 
				"),\n" + 
				"\n" + 
				"--plan mileage summary\n" + 
				"new_fiber_fronthaul_tab AS (\n" + 
				"SELECT g.name, 'Miles of New Fiber Planned (fronthaul)'::varchar, SUM (length_meters) / 1609.34\n" + 
				"FROM financial.network_report n\n" + 
				"JOIN financial.fiber_summary_cost f ON f.network_report_id = n.id\n" + 
				"JOIN financial.network_cost_code c ON c.id = f.network_cost_code_id\n" + 
				"JOIN g_plan g ON g.id = n.plan_id\n" + 
				"WHERE c.description IN (\n" + 
				"  'Feeder Fiber Default Installation',\n" + 
				"  'Distibution Fiber Default Installation'\n" + 
				"  )\n" + 
				"GROUP BY g.name\n" + 
				"),\n" + 
				"\n" + 
				"new_fiber_fronthaul_c AS (\n" + 
				"SELECT 'C'::varchar, 'Miles of New Fiber Planned (fronthaul)'::varchar, SUM (length_meters) / 1609.34\n" + 
				"FROM financial.network_report n\n" + 
				"JOIN financial.fiber_summary_cost f ON f.network_report_id = n.id\n" + 
				"JOIN financial.network_cost_code c ON c.id = f.network_cost_code_id\n" + 
				"JOIN wp_plan p ON p.id = n.plan_id\n" + 
				"WHERE c.description IN (\n" + 
				"  'Feeder Fiber Default Installation',\n" + 
				"  'Distibution Fiber Default Installation'\n" + 
				"  )\n" + 
				"),\n" + 
				"\n" + 
				"conduit_fronthaul_tab AS (\n" + 
				"SELECT g.name, 'Miles of Existing Fiber Augment (fronthaul)'::varchar, SUM (length_meters) / 1609.34\n" + 
				"FROM financial.network_report n\n" + 
				"JOIN financial.fiber_summary_cost f ON f.network_report_id = n.id\n" + 
				"JOIN financial.network_cost_code c ON c.id = f.network_cost_code_id\n" + 
				"JOIN g_plan g ON g.id = n.plan_id\n" + 
				"WHERE c.description IN (\n" + 
				"  'Feeder Fiber Conduit Installation',\n" + 
				"  'Distibution Fiber Conduit Installation'\n" + 
				"  )\n" + 
				"GROUP BY g.name\n" + 
				"),\n" + 
				"\n" + 
				"conduit_fronthaul_c AS (\n" + 
				"SELECT 'C'::varchar, 'Miles of Existing Fiber Augment (fronthaul)'::varchar, SUM (length_meters) / 1609.34\n" + 
				"FROM financial.network_report n\n" + 
				"JOIN financial.fiber_summary_cost f ON f.network_report_id = n.id\n" + 
				"JOIN financial.network_cost_code c ON c.id = f.network_cost_code_id\n" + 
				"JOIN wp_plan p ON p.id = n.plan_id\n" + 
				"WHERE c.description IN (\n" + 
				"  'Feeder Fiber Conduit Installation',\n" + 
				"  'Distibution Fiber Conduit Installation'\n" + 
				"  )\n" + 
				")\n" + 
				"\n" + 
				"\n" + 
				"--consolidate output\n" + 
				"SELECT * FROM detailed_towers\n" + 
				"UNION\n" + 
				"SELECT * FROM count_tam_biz\n" + 
				"UNION\n" + 
				"SELECT * FROM tam_building_cat_sum\n" + 
				"UNION\n" + 
				"SELECT * FROM vzb_buildings\n" + 
				"UNION\n" + 
				"SELECT * FROM vzb_total_mrc\n" + 
				"UNION\n" + 
				"SELECT * FROM hubs\n" + 
				"UNION \n" + 
				"SELECT * FROM total_tam_cust\n" + 
				"UNION \n" + 
				"SELECT * FROM total_tam_buildings\n" + 
				"UNION \n" + 
				"SELECT * FROM total_vz_cust_2k\n" + 
				"UNION\n" + 
				"SELECT * FROM unrouted_towers\n" + 
				"UNION\n" + 
				"SELECT * FROM routed_towers\n" + 
				"UNION \n" + 
				"SELECT * FROM existing_miles\n" + 
				"UNION\n" + 
				"SELECT * FROM new_fiber_fronthaul_tab\n" + 
				"UNION\n" + 
				"SELECT * FROM new_fiber_fronthaul_c\n" + 
				"UNION\n" + 
				"SELECT * FROM conduit_fronthaul_tab\n" + 
				"UNION\n" + 
				"SELECT * FROM conduit_fronthaul_c");
	}

}
