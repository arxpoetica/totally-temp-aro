package com.altvil.aro.service.cost;

import java.util.List;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;

public interface CostService {
	
	void updateWireCenterCosts(long planId) ;
	void updateMasterPlanCosts(long planId) ;
	
	List<FiberSummaryCost> getFiberReport(long planId) ;
	List<EquipmentSummaryCost> getEquipmentReport(long planId) ;

}
