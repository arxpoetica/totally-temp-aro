package com.altvil.aro.service.demand;

import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.Pair;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public interface PinnedAssignedEntityDemand extends AssignedEntityDemand {
	
	PinnedLocation getPinnedLocation() ;
	Pair<PinnedAssignedEntityDemand> split(Pair<LocationDemand> pair);


}
