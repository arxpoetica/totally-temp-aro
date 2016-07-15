package com.altvil.netop.plan;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.report.PlanAnalysisReport;

public class MasterPlanJobResponse {

	private Job<MasterPlanUpdate> job;
	private PlanAnalysisReport planAnalysisReport ;

	public Job<MasterPlanUpdate> getJob() {
		return job;
	}

	public void setJob(Job<MasterPlanUpdate> job) {
		this.job = job;
	}

	public PlanAnalysisReport getPlanAnalysisReport() {
		return planAnalysisReport;
	}

	public void setPlanAnalysisReport(PlanAnalysisReport planAnalysisReport) {
		this.planAnalysisReport = planAnalysisReport;
	}

	

}
