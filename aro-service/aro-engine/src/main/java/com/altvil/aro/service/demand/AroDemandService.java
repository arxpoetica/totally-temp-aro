package com.altvil.aro.service.demand;

import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.entity.LocationDemand;

public interface AroDemandService {

	 LocationDemand createDemandByCensusBlock(int blockId, DemandMapping mapping, SpeedCategory speetCategory) ;
	 LocationDemand createFullShareDemand(DemandMapping mapping) ;
	
}
