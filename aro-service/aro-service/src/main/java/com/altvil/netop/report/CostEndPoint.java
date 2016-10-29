package com.altvil.netop.report;

import java.io.IOException;
import java.io.Writer;
import java.sql.SQLException;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.persistence.repository.report.ExtendedReportService;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.netop.model.AroPlanAnalysisReport;
import com.altvil.netop.service.AroConversionService;

@RestController
public class CostEndPoint {

	@Autowired
	private ExtendedReportService tabcReportService;
	@Autowired
	private NetworkReportService reportingService;
	@Autowired
	private NetworkReportService costService;
	@Autowired
	private AroConversionService aroConversionService;

	@RequestMapping(value = "/report-extended/{name}/{plan_id}.csv", method = RequestMethod.GET, produces = "text/csv")
	public void getExtendedReport(@PathVariable String name,
			@PathVariable long planId, Writer responseWriter)
			throws SQLException, IOException {
		tabcReportService.queryReport(name, planId, responseWriter);
	}

	@RequestMapping(value = "/report/plan/{id}", method = RequestMethod.GET)
	public @ResponseBody AroPlanAnalysisReport getReportSummary(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {

		PlanAnalysisReport report = costService.loadSummarizedPlan(planId)
				.getPlanAnalysisReport();

		return aroConversionService.toAroPlanAnalysisReport(report);

	}

	@RequestMapping(value = "/report/plan/{id}/equipment_summary", method = RequestMethod.GET)
	public @ResponseBody List<EquipmentSummaryCost> getEquipmentSummary(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {
		return costService.getEquipmentReport(planId);
	}

	@RequestMapping(value = "/report/plan/{id}/fiber_summary", method = RequestMethod.GET)
	public @ResponseBody List<FiberSummaryCost> getFiberSummary(
			@PathVariable("id") long planId) throws NoSuchStrategy,
			InterruptedException {
		return costService.getFiberReport(planId);
	}

}
