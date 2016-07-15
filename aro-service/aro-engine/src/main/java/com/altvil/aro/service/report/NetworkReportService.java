package com.altvil.aro.service.report;

import java.util.List;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.model.NetworkReportSummary;

public interface NetworkReportService {
	
	NetworkReportSummary saveNetworkReport(SummarizedPlan plan) ;
	SummarizedPlan loadSummarizedPlan(long planId) ;
	
	NetworkReportSummary getNetworkReportSummary(long planId) ;
	
	Double getTotalPlanCost(long planId) ;
	List<FiberSummaryCost> getFiberReport(long planId) ;
	List<EquipmentSummaryCost> getEquipmentReport(long planId) ;

}
