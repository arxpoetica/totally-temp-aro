package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.List;

import org.apache.ignite.IgniteCompute;
import org.apache.ignite.lang.IgniteCallable;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;

import com.altvil.aro.service.job.impl.JobRequestIgniteCallable;

public class MasterPlanBuilder extends JobRequestIgniteCallable<MasterPlanUpdate> {
	public MasterPlanBuilder(Principal creator, IgniteCompute compute, IgniteCallable<MasterPlanUpdate> callable) {
		super(creator, compute, callable);
	}

	private List<FiberPlanConfiguration> wireCenterPlans;

	public List<FiberPlanConfiguration> getWireCenterPlans() {
		return wireCenterPlans;
	}

	public void setWireCenterPlans(List<FiberPlanConfiguration> wireCenterPlans) {
		this.wireCenterPlans = wireCenterPlans;
	}

}
