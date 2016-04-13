package com.altvil.aro.service.planing;

import java.util.List;

import com.altvil.aro.service.job.JobService;

public class MasterPlanBuilder extends JobService.Builder<MasterPlanUpdate> {
	private List<Long> wireCenterPlans;

	public List<Long> getWireCenterPlans() {
		return wireCenterPlans;
	}

	public void setWireCenterPlans(List<Long> wireCenterPlans) {
		this.wireCenterPlans = wireCenterPlans;
	}
}
