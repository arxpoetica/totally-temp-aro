package com.altvil.aro.service.roic;

import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilder;

public interface RoicInputService {

	NetworkRunningCosts getNetworkRunningCosts(LocationDemand locationDemand,
			SpeedCategory speedCategory);
	
	RoicBuilder createRoicBuilder(PlanAnalysisReport planAnalysisReport) ;

}
