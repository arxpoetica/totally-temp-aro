package com.altvil.aro.service.graph.transform.ftp;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public interface LocationDemand {
	
	public PinnedLocation getPinnedLocation() ;
	public LocationEntity getLocationEntity() ;
	public double getDemand() ;

}
