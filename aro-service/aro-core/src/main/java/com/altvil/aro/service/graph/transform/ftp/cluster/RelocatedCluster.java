package com.altvil.aro.service.graph.transform.ftp.cluster;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;

import java.util.Collection;

public class RelocatedCluster implements LocationCluster {

	private double distance;
	private LocationCluster locationCluster;
	private PinnedLocation newLocation ;
	
	public RelocatedCluster(double distance, LocationCluster locationCluster,
			PinnedLocation newLocation) {
		super();
		this.distance = distance;
		this.locationCluster = locationCluster;
		this.newLocation = newLocation;
	}

	@Override
	public GeoSegment geoGeoSegment() {
		return newLocation.getGeoSegment() ;
	}

	@Override
	public double getLocationCount() {
		return locationCluster.getLocationCount();
	}

	@Override
	public boolean canAdd(GraphEdgeAssignment li) {
		return locationCluster.canAdd(li);
	}

	@Override
	public boolean isEmpty() {
		return locationCluster.isEmpty();
	}

	@Override
	public PinnedLocation getPinnedLocation() {
		return newLocation ;
	}

	@Override
	public Collection<GraphEdgeAssignment> getLocations() {
		return locationCluster.getLocations();
	}

	@Override
	public double getLongestDistanceToEndVertex() {
		return newLocation.getOffsetFromEndVertex() + distance;
	}

}
