package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.List;
import java.util.concurrent.ExecutorService;

import org.apache.ignite.IgniteCompute;
import org.apache.ignite.lang.IgniteCallable;

import com.altvil.aro.service.job.impl.JobRequestIgniteCallable;
import com.altvil.aro.service.planning.NetworkConfiguration;

public class MasterPlanBuilder extends JobRequestIgniteCallable<MasterPlanUpdate> {
	public MasterPlanBuilder(Principal creator, IgniteCompute compute, IgniteCallable<MasterPlanUpdate> callable) {
		super(creator, compute, callable);
	}
	
	public MasterPlanBuilder(Principal creator, ExecutorService compute, IgniteCallable<MasterPlanUpdate> callable) {
		super(creator, compute, callable);
	}

	private List<? extends NetworkConfiguration> wireCenterPlans;

	public List<? extends NetworkConfiguration> getWireCenterPlans() {
		return wireCenterPlans;
	}

	public void setWireCenterPlans(List<? extends NetworkConfiguration> wireCenterPlans) {
		this.wireCenterPlans = wireCenterPlans;
	}

}
