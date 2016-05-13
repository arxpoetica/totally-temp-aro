package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.List;

import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.network.PlanId;

public class MasterPlanBuilder extends JobService.Builder<MasterPlanUpdate> {
	public MasterPlanBuilder(Principal creator) {
		super(creator);
	}

	private List<PlanId> wireCenterPlans;

	public List<PlanId> getWireCenterPlans() {
		return wireCenterPlans;
	}

	public void setWireCenterPlans(List<PlanId> wireCenterPlans) {
		this.wireCenterPlans = wireCenterPlans;
	}
}
