package com.altvil.netop.optimize;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.netop.model.AroPlanAnalysisReport;

public class AroMasterPlanJobResponse {


	private Job<MasterPlanUpdate> job;
	private AroPlanAnalysisReport planAnalysisReport ;

	public Job<MasterPlanUpdate> getJob() {
		return job;
	}

	public void setJob(Job<MasterPlanUpdate> job) {
		this.job = job;
	}

	public AroPlanAnalysisReport getPlanAnalysisReport() {
		return planAnalysisReport;
	}

	public void setPlanAnalysisReport(AroPlanAnalysisReport planAnalysisReport) {
		this.planAnalysisReport = planAnalysisReport;
	}

	

	
}
