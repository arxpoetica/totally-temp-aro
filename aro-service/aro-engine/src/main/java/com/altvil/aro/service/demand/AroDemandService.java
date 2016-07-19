package com.altvil.aro.service.demand;

import java.util.Collection;

import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.impl.FairShareDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveMapping;
import com.altvil.aro.service.entity.LocationDemand;

public interface AroDemandService {

	FairShareDemandMapping createFairShareDemandMapping(
			CompetitiveMapping competiveMapping);

	LocationDemand createFullShareDemand(DemandMapping mapping);
	
	LocationDemand aggregateDemandForSpeedCategory(
			Collection<CompetitiveLocationDemandMapping> demandMapping,
			SpeedCategory speedCategory) ;

}
