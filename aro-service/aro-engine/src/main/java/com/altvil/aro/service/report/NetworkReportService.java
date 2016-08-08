package com.altvil.aro.service.report;

import java.util.List;
import java.util.function.Function;

import com.altvil.aro.model.EquipmentSummaryCost;
import com.altvil.aro.model.FiberSummaryCost;
import com.altvil.aro.model.NetworkCostCode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.model.NetworkReportSummary;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.interfaces.CableConstructionEnum;

public interface NetworkReportService {

	
	NetworkCostCode getCostCode(NetworkNodeType nt);
	NetworkCostCode getCostCode(FiberType nt, CableConstructionEnum constructionType);

	
	NetworkReportSummary saveNetworkReport(SummarizedPlan plan);

	SummarizedPlan loadSummarizedPlan(long planId);

	<T> T transformNetworkReportSummary(long planId,
			Function<NetworkReportSummary, T> transform);

	Double getTotalPlanCost(long planId);

	List<FiberSummaryCost> getFiberReport(long planId);

	List<EquipmentSummaryCost> getEquipmentReport(long planId);

}
