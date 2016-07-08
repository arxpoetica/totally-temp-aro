package com.altvil.aro.service.graph.builder;

import static java.util.stream.Collectors.groupingBy;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.AroRoadLocation;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations.LocationEntityAssignment;
import com.altvil.aro.service.graph.segment.impl.RoadLocationImpl;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;

public class RoadModelBuilder extends GraphNetworkBuilder {

	private static final Logger log = LoggerFactory
			.getLogger(RoadModelBuilder.class.getName());

	private Map<Long, List<NetworkAssignment>> roadLocationsByTlid = new HashMap<>();

	public RoadModelBuilder(GraphModelBuilder<GeoSegment> graphModelBuilder,
			GraphNodeFactory vertexFactory, GraphAssignmentFactory factory) {
		super(graphModelBuilder, vertexFactory, factory);
	}

	public RoadModelBuilder setFiberSources(
			Collection<NetworkAssignment> fiberSources) {
		super.setNetworkAssignments(fiberSources);
		return this;
	}

	public RoadModelBuilder setRoadLocations(
			Collection<NetworkAssignment> roadLocations) {
		// roadLocationsByGid = groupByGid(roadLocations);

		int locationsLoaded = roadLocations.size();
		if (log.isDebugEnabled())
			log.debug("Locations Loaded " + locationsLoaded);
		roadLocationsByTlid = groupByTlid(roadLocations);
		return this;
	}

	private boolean hasFiberDemand(NetworkAssignment roadLocation) {
		
		LocationEntity locationEntity = (LocationEntity) roadLocation.getSource() ;
		LocationDemand coverageAggregateStatistic = locationEntity.getLocationDemand() ;
		
		return coverageAggregateStatistic != null
				&& coverageAggregateStatistic.getAtomicUnits() > 0;

	}

	private Map<Long, List<NetworkAssignment>> groupByTlid(
			Collection<NetworkAssignment> locations) {
		return locations.stream().filter(this::hasFiberDemand)
				.collect(groupingBy(a -> a.getDomain().getTlid()));
	}

	@Override
	protected List<LocationEntityAssignment> getOrderedLocationsByRoadEdge(
			RoadEdge roadEdge) {

		Long tlid = roadEdge.getTlid();

		List<NetworkAssignment> result = roadLocationsByTlid.get(tlid);

		if (result == null) {
			return Collections.emptyList();
		}

		Collections.sort(
				result,
				(l1, l2) -> Double.compare(l1.getDomain().getRoadSegmentPositionRatio(),
						l2.getDomain().getRoadSegmentPositionRatio()));

		List<LocationEntityAssignment> filteredLocations = result
				.stream()
				.filter(l -> {
					if (l.getDomain().getRoadSegmentPositionRatio() < -0.01
							|| l.getDomain().getRoadSegmentPositionRatio() > 1.01) {
						log.info("Detected Inavlid Location Data " + l.getSource().getObjectId() 
								+ " ratio=" + l.getDomain().getRoadSegmentPositionRatio());
						return false;
					}
					return true;
				})
				.map(l -> {

					//Snap Ratio
					double ratio = Math.max(Math.min(1.0, l.getDomain().getRoadSegmentPositionRatio() ),0.0) ;
					
					RoadLocation domain = l.getDomain() ;
					
					AroRoadLocation location = new RoadLocationImpl(domain.getLocationPoint(), ratio, domain
							.getRoadSegmentClosestPoint(), domain
							.getDistanceFromRoadSegmentInMeters());
					
					return new LocationEntityAssignment((LocationEntity)l.getSource(), location);
					
				}).collect(Collectors.toList());

		return filteredLocations;
	}

}
