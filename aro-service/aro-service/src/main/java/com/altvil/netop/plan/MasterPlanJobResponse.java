package com.altvil.netop.plan;

import java.util.List;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.planing.MasterPlanUpdate;

public class MasterPlanJobResponse {

	private Job<MasterPlanUpdate> job;
	private List<Long> wireCenterids;

	public Job<MasterPlanUpdate> getJob() {
		return job;
	}

	public void setJob(Job<MasterPlanUpdate> job) {
		this.job = job;
	}

	public List<Long> getWireCenterids() {
		return wireCenterids;
	}

	public void setWireCenterids(List<Long> wireCenterids) {
		this.wireCenterids = wireCenterids;
	}

}
