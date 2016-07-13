package com.altvil.aro.service.cost;

import java.util.Collection;
import java.util.List;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.service.optimization.OptimizedPlan;

public interface CostService {
	
	public Double getTotalPlanCost(long planId) ;
	
	PlanAnalysisReport createPlanAnalysisReport(OptimizedPlan network) ;
	PlanAnalysisReport updateWireCenterCosts(OptimizedPlan optimizedPlan) ;
	
	void updateMasterPlanCosts(long planId, Collection<PlanAnalysisReport> updates) ;
	
	List<FiberSummaryCost> getFiberReport(long planId) ;
	List<EquipmentSummaryCost> getEquipmentReport(long planId) ;

}
