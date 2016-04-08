package com.altvil.aro.service.graph.transform.ftp.cluster;

import java.util.Collection;

import com.altvil.aro.service.demand.DefaultAssignedEntityDemand;
import com.altvil.aro.service.demand.PinnedAssignedEntityDemand;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public interface LocationCluster {

	public GeoSegment geoGeoSegment();

	public double getLocationCount();

	public boolean canAdd(DefaultAssignedEntityDemand li);

	public boolean isEmpty();

	public PinnedLocation getPinnedLocation();

	public Collection<PinnedAssignedEntityDemand> getLocations();
	
	public double getLongestDistanceToEndVertex() ;


}