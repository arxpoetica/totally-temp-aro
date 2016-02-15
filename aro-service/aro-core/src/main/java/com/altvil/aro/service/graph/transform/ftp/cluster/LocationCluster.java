package com.altvil.aro.service.graph.transform.ftp.cluster;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;

import java.util.Collection;

public interface LocationCluster {

	public GeoSegment geoGeoSegment();

	public double getLocationCount();

	public boolean canAdd(GraphEdgeAssignment li);

	public boolean isEmpty();

	public PinnedLocation getPinnedLocation();

	public Collection<GraphEdgeAssignment> getLocations();
	
	public double getLongestDistanceToEndVertex() ;


}