package com.altvil.aro.service.graph.builder;

import java.util.Collection;

import com.altvil.aro.service.graph.segment.RatioSection;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations.LocationEntityAssignment;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;

public interface RoadEdgeInfo {

	RoadEdge getRoadEdge();

	Collection<RatioSection> getSections();

	Collection<LocationEntityAssignment> getOrderedLocations();

	Collection<NetworkAssignment> getNetworkAssignments();

}
