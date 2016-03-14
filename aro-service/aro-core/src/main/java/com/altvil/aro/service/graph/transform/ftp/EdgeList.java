package com.altvil.aro.service.graph.transform.ftp;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.altvil.aro.service.demand.AssignedEntityDemand;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public class EdgeList {

	private static List<AssignedEntityDemand> EMPTY_LIST = Collections
			.emptyList();
	public static EdgeList EMPTY_EDGE = new EdgeList(null, EMPTY_LIST, 0);

	private AroEdge<GeoSegment> edge;
	
	private List<AssignedEntityDemand> pinnedLocations ;
	private double totalDemand ;
	private double[] cumlativeDemand ;
	private double length;
	
	

	public EdgeList(AroEdge<GeoSegment> edge,
			List<AssignedEntityDemand> pinnedLocations, double length) {
		super();
		this.edge = edge;
		this.pinnedLocations = pinnedLocations;
		this.length = length;
		
		init(pinnedLocations) ;
	}

	private void init(List<AssignedEntityDemand> assignments) {
		double  totalDemand = 0 ;
		
		cumlativeDemand = new double[assignments.size()] ;
		
		int index = 0 ;
		for(AssignedEntityDemand a : assignments) {
			totalDemand += a.getHouseholdFiberDemandValue() ;
			cumlativeDemand[index++] = totalDemand ;
		}
		
		this.totalDemand = totalDemand ;
	}

	
	public double getTotalLocationDemand() {
		return totalDemand ;
	}

	public int indexOf(double coverageDemand) {
		int index = Arrays.binarySearch(cumlativeDemand, coverageDemand);
		return index < 0 ? (index * -1) - 1 : index;
	}

	public EdgeList subEdgeToEnd(int startIndex) {

		if (startIndex >= pinnedLocations.size()) {
			return new EdgeList(edge, new ArrayList<>(), length);
		}

		PinnedLocation pl = pinnedLocations.get(startIndex).getPinnedLocation();
		double length = edge.getWeight() - pl.getOffsetFromStartVertex();
		List<AssignedEntityDemand> subList = pinnedLocations.subList(startIndex,
				pinnedLocations.size());
		return new EdgeList(edge, subList, length);
	}

	public EdgeList subEdge(int startIndex, int endIndex) {

		if (startIndex < 0 || startIndex >= pinnedLocations.size()
				|| endIndex < 0 || endIndex > pinnedLocations.size()
				|| (endIndex < startIndex)) {
			throw new IllegalArgumentException("Inavlid sub range "
					+ startIndex + " " + endIndex);
		}

		if (endIndex - startIndex == 0) {
			return new EdgeList(edge, EMPTY_LIST, 0.0);
		}

		PinnedLocation p1 = pinnedLocations.get(startIndex).getPinnedLocation();
		PinnedLocation p2 = pinnedLocations.get(endIndex - 1)
				.getPinnedLocation();
		List<AssignedEntityDemand> subList = pinnedLocations.subList(startIndex,
				endIndex);
		return new EdgeList(edge, subList, p2.getOffsetFromStartVertex()
				- p1.getOffsetFromStartVertex());
	}

	public double getLength() {
		return length;
	}

	public int getLocationCount() {
		return pinnedLocations.size();
	}
	
	

	public GeoSegment getGeoSegment() {
		return edge == null ? null : edge.getValue();
	}

	public EdgeDemand getEdgeDemand() {
		return null ;
	}

	public List<AssignedEntityDemand> getAssignedEntityDemands() {
		return pinnedLocations;
	}

	
}
