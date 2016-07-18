package com.altvil.aro.service.demand;

import com.altvil.aro.service.demand.impl.FairShareDemandMapping;
import com.altvil.aro.service.entity.LocationDemand;

public interface AroDemandService {

	FairShareDemandMapping createFairShareDemandMapping(
			CompetitiveMapping competiveMapping);

//	LocationDemand createDemandByCensusBlock(int blockId,
//			DemandMapping mapping, SpeedCategory speetCategory);

	LocationDemand createFullShareDemand(DemandMapping mapping);

}
