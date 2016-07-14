package com.altvil.aro.service.demand;

import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.roic.model.NetworkType;

public interface ProductDemandStatistic extends DemandStatistic {

	DemandStatistic getDemandStatistic(NetworkType type) ;
	
}
