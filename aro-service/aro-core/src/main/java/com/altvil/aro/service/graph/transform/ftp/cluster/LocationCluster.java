package com.altvil.aro.service.graph.transform.ftp.cluster;

import java.util.Collection;

import com.altvil.aro.service.demand.AssignedEntityDemand;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public interface LocationCluster {

	public GeoSegment geoGeoSegment();

	public double getLocationCount();

	public boolean canAdd(AssignedEntityDemand li);

	public boolean isEmpty();

	public PinnedLocation getPinnedLocation();

	public Collection<AssignedEntityDemand> getLocations();
	
	public double getLongestDistanceToEndVertex() ;


}