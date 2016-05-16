package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.List;

import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;

public class MasterPlanBuilder extends JobService.Builder<MasterPlanUpdate> {
	public MasterPlanBuilder(Principal creator) {
		super(creator);
	}

	private List<FiberPlanConfiguration> wireCenterPlans;

	public List<FiberPlanConfiguration> getWireCenterPlans() {
		return wireCenterPlans;
	}

	public void setWireCenterPlans(List<FiberPlanConfiguration> wireCenterPlans) {
		this.wireCenterPlans = wireCenterPlans;
	}
}
