package com.altvil.aro.service.graph.transform.ftp;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;

import java.util.*;

public class EdgeList {

	private static List<GraphEdgeAssignment> EMPTY_LIST = Collections
			.emptyList();
	public static EdgeList EMPTY_EDGE = new EdgeList(null, EMPTY_LIST, 0);

	private AroEdge<GeoSegment> edge;
	private List<GraphEdgeAssignment> pinnedLocations;
	private List<LocationDemand> locationDemand ;
	private double totalDemand ;
	private double[] cumlativeDemand ;
	private double length;
	
	

	public EdgeList(AroEdge<GeoSegment> edge,
			List<GraphEdgeAssignment> pinnedLocations, double length) {
		super();
		this.edge = edge;
		this.pinnedLocations = pinnedLocations;
		this.length = length;
		
		init(pinnedLocations) ;

		// if( this.length == 0 && pinnedLocations.size() > 0 ) {
		// throw new IllegalArgumentException("Lnegth not defined") ;
		// }

	}

	// private EdgeList subEdgeFromStart(int endIndex) {
	//
	// PinnedLocation pl = pinnedLocations.get(endIndex - 1)
	// .getPinnedLocation();
	// pl.getOffsetFromStartVertex();
	// List<GraphEdgeAssignment> subList = pinnedLocations
	// .subList(0, endIndex);
	// return new EdgeList(edge, subList, pl.getOffsetFromStartVertex());
	// }

	private void init(List<GraphEdgeAssignment> assignments) {
		double  totalDemand = 0 ;
		List<LocationDemand> locationDemand = new ArrayList<>(assignments.size()) ;
		cumlativeDemand = new double[assignments.size()] ;
		
		int index = 0 ;
		for(GraphEdgeAssignment a : assignments) {
			LocationDemand ld = new LocationDemandImpl(a) ;
			locationDemand.add(ld) ;
			totalDemand += ld.getDemand() ;
			cumlativeDemand[index++] = totalDemand ;
		}
		
		this.totalDemand = totalDemand ;
		this.locationDemand = locationDemand ;
		
	}

	public Collection<LocationDemand> getLocationDemands() {
		return locationDemand ;
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
		List<GraphEdgeAssignment> subList = pinnedLocations.subList(startIndex,
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
		List<GraphEdgeAssignment> subList = pinnedLocations.subList(startIndex,
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

	public List<GraphEdgeAssignment> getGraphEdgeAssignments() {
		return pinnedLocations;
	}

	private static class LocationDemandImpl implements LocationDemand {

		private GraphEdgeAssignment graphEdgeAssignment;

		public LocationDemandImpl(GraphEdgeAssignment graphEdgeAssignment) {
			super();
			this.graphEdgeAssignment = graphEdgeAssignment;
		}

		@Override
		public PinnedLocation getPinnedLocation() {
			return graphEdgeAssignment.getPinnedLocation();
		}

		@Override
		public LocationEntity getLocationEntity() {
			return (LocationEntity) graphEdgeAssignment.getAroEntity();
		}

		@Override
		public double getDemand() {
			return getLocationEntity().getCoverageStatistics().getFiberDemand();
		}

	}
}
