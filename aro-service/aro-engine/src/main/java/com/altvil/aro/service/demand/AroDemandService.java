package com.altvil.aro.service.demand;

import com.altvil.aro.service.entity.LocationDemand;

public interface AroDemandService {

	 LocationDemand createDemandByCensusBlock(String censusBlockId, DemandMapping mapping) ;
	
}
