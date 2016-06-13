package com.altvil.aro.service.cost.impl;

import java.util.Date;
import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.NetworkReport;
import com.altvil.aro.model.ReportType;
import com.altvil.aro.persistence.repository.NetworkReportRepository;
import com.altvil.aro.service.cost.CostService;

@Service
public class CostServiceImpl implements CostService {

	private NetworkReportRepository networkReportRepository;
	
	@Autowired
	public CostServiceImpl(NetworkReportRepository networkReportRepository) {
		super();
		this.networkReportRepository = networkReportRepository;
	}

	@Override
	public void updateWireCenterCosts(long planId) {
		
		networkReportRepository.deleteReportsForPlan(planId);

		update(planId, ReportType.detail_equipment,
				(report) -> networkReportRepository
						.updateWireCenterEquipmentCost(report.getId()));

		update(planId, ReportType.summary_equipment,
				(report) -> networkReportRepository
						.updateWireCenterEquipmentSummary(report.getId()));

		update(planId, ReportType.summary_fiber,
				(report) -> networkReportRepository
						.updateWireCenterFiberSummary(report.getId()));

	}

	@Override
	public void updateMasterPlanCosts(long planId) {
		
		networkReportRepository.deleteReportsForPlan(planId);

		update(planId, ReportType.summary_equipment,
				(report) -> networkReportRepository
						.updateMasterPlanEquipmentSummary(report.getId()));

		update(planId, ReportType.summary_fiber,
				(report) -> networkReportRepository
						.updateMasterPlanFiberSummary(report.getId()));
	}

	private void update(long planId, ReportType rt,
			Consumer<NetworkReport> action) {
		NetworkReport report = createNetworkReport(planId, rt);
		networkReportRepository.save(report);
		action.accept(report);
	}
	
	@Transactional
	private NetworkReport createReport(long planId, ReportType rt) {
		NetworkReport report = createNetworkReport(planId, rt);
		networkReportRepository.save(report);
		return report ;
	}

	private NetworkReport createNetworkReport(long planId, ReportType type) {
		NetworkReport report = new NetworkReport();
		report.setPlanId(planId);
		report.setDate(new Date());
		report.setReportType(type);
		return report;
	}

}
