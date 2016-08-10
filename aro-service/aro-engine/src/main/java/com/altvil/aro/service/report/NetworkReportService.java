package com.altvil.aro.service.report;

import java.util.List;
import java.util.function.Function;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.model.NetworkCostCode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.model.NetworkReportSummary;
import com.altvil.interfaces.FiberCableConstructionType;

public interface NetworkReportService {

	
	NetworkCostCode getCostCode(NetworkNodeType nt);
	NetworkCostCode getCostCode(FiberCableConstructionType fiberConstructionType);

	
	NetworkReportSummary saveNetworkReport(SummarizedPlan plan);

	SummarizedPlan loadSummarizedPlan(long planId);

	<T> T transformNetworkReportSummary(long planId,
			Function<NetworkReportSummary, T> transform);

	Double getTotalPlanCost(long planId);

	List<FiberSummaryCost> getFiberReport(long planId);

	List<EquipmentSummaryCost> getEquipmentReport(long planId);

}
