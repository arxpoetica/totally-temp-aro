package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.List;

import org.apache.ignite.IgniteCompute;
import org.apache.ignite.lang.IgniteCallable;

import com.altvil.aro.service.job.impl.JobRequestIgniteCallable;

public class MasterPlanBuilder extends JobRequestIgniteCallable<MasterPlanUpdate> {
	public MasterPlanBuilder(Principal creator, IgniteCompute compute, IgniteCallable<MasterPlanUpdate> callable) {
		super(creator, compute, callable);
	}

	private List<Long> wireCenterPlans;

	public List<Long> getWireCenterPlans() {
		return wireCenterPlans;
	}

	public void setWireCenterPlans(List<Long> wireCenterPlans) {
		this.wireCenterPlans = wireCenterPlans;
	}

}
