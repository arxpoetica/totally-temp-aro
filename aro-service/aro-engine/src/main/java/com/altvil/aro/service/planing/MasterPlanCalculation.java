package com.altvil.aro.service.planing;

import java.util.List;
import java.util.concurrent.Future;

public interface MasterPlanCalculation {

	List<Long> getWireCenterPlans();
	
	Future<MasterPlanUpdate> getFuture() ;

}
