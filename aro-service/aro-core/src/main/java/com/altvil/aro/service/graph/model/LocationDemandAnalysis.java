package com.altvil.aro.service.graph.model;

import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.entity.LocationDemand;

public interface LocationDemandAnalysis {
	
	LocationDemand getSelectedDemand();

	LocationDemand getLocationDemand(SpeedCategory speedCategory);
	
}
