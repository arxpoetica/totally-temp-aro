package com.altvil.aro.service.demand.analysis;

import com.altvil.aro.service.demand.analysis.model.FairShareLocationDemand;

public interface DemandAnalysisService {

	FairShareLocationDemand createEffectiveLocationDemand(
			NetworkCapacityProfile profile);

}
