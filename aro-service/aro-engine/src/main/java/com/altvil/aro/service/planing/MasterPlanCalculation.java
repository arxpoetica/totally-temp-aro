package com.altvil.aro.service.planing;

import java.util.List;
import java.util.concurrent.Future;

import com.altvil.aro.service.network.PlanId;

public interface MasterPlanCalculation {

	List<PlanId> getWireCenterPlans();
	
	Future<MasterPlanUpdate> getFuture() ;

}
