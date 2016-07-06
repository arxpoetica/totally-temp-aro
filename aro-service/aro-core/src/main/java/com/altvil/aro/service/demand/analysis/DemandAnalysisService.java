package com.altvil.aro.service.demand.analysis;

import com.altvil.aro.service.demand.analysis.model.EffectiveLocationDemand;

public interface DemandAnalysisService {

	EffectiveLocationDemand createEffectiveLocationDemand(
			NetworkCapacityProfile profile);

}
