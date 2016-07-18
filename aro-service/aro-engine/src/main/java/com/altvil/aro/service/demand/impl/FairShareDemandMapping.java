package com.altvil.aro.service.demand.impl;

import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.analysis.model.FairShareLocationDemand;

public interface FairShareDemandMapping {

	FairShareLocationDemand getFairShareLocationDemand(
			SpeedCategory speedCategory);

}