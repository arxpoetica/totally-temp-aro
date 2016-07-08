package com.altvil.aro.service.cost;

import java.util.List;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public interface CostService {
	
	public Double getTotalPlanCost(long planId) ;
	
	void updateWireCenterCosts(WirecenterNetworkPlan planId) ;
	void updateMasterPlanCosts(long planId) ;
	
	List<FiberSummaryCost> getFiberReport(long planId) ;
	List<EquipmentSummaryCost> getEquipmentReport(long planId) ;

}
