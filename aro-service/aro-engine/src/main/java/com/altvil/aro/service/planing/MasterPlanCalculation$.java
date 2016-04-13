package com.altvil.aro.service.planing;

import java.util.List;

import com.altvil.aro.service.job.Job;

public interface MasterPlanCalculation$ {

	List<Long> getWireCenterPlans();
	
	Job<MasterPlanUpdate> getJob() ;

}
