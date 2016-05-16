package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.List;

import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;

public class MasterPlanBuilder extends JobService.Builder<MasterPlanUpdate> {
	public MasterPlanBuilder(Principal creator) {
		super(creator);
	}

	private List<FiberPlanConfiguration<? extends AbstractFiberPlan>> wireCenterPlans;

	public List<FiberPlanConfiguration<? extends AbstractFiberPlan>> getWireCenterPlans() {
		return wireCenterPlans;
	}

	public void setWireCenterPlans(List<FiberPlanConfiguration<? extends AbstractFiberPlan>> wireCenterPlans) {
		this.wireCenterPlans = wireCenterPlans;
	}
}
