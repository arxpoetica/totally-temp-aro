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

import com.altvil.aro.service.entity.CoverageAggregateStatistic;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.AroRoadLocation;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations.LocationEntityAssignment;
import com.altvil.aro.service.graph.segment.impl.RoadLocationImpl;
import com.altvil.interfaces.GraphPoint;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;

public class RoadModelBuilder extends GraphNetworkBuilder {

	private static final Logger log = LoggerFactory
			.getLogger(RoadModelBuilder.class.getName());

	private Map<? extends RoadLocation, ? extends CoverageAggregateStatistic> roadLocationsProperties;
	private Map<Long, List<RoadLocation>> roadLocationsByTlid = new HashMap<>();

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
			Collection<RoadLocation> roadLocations,
			Map<RoadLocation, CoverageAggregateStatistic> roadLocationsProperties) {
		// roadLocationsByGid = groupByGid(roadLocations);

		int locationsLoaded = roadLocations.size();
		if (log.isDebugEnabled())
			log.debug("Locations Loaded " + locationsLoaded);
		this.roadLocationsProperties = roadLocationsProperties;
		roadLocationsByTlid = groupByTlid(roadLocations);
		return this;
	}

	private boolean hasFiberDemand(RoadLocation roadLocation) {
		CoverageAggregateStatistic coverageAggregateStatistic = roadLocationsProperties
				.get(roadLocation);
		return coverageAggregateStatistic != null
				&& coverageAggregateStatistic.getFiberDemand() > 0;

	}

	private Map<Long, List<RoadLocation>> groupByTlid(
			Collection<? extends RoadLocation> locations) {
		return locations.stream().filter(this::hasFiberDemand)
				.collect(groupingBy(GraphPoint::getTlid));
	}

	@Override
	protected List<LocationEntityAssignment> getOrderedLocationsByRoadEdge(
			RoadEdge roadEdge) {

		Long tlid = roadEdge.getTlid();

		List<RoadLocation> result = roadLocationsByTlid.get(tlid);

		if (result == null) {
			return Collections.emptyList();
		}

		Collections.sort(
				result,
				(l1, l2) -> Double.compare(l1.getRoadSegmentPositionRatio(),
						l2.getRoadSegmentPositionRatio()));

		List<LocationEntityAssignment> filteredLocations = result
				.stream()
				.filter(l -> {
					if (l.getRoadSegmentPositionRatio() < -0.01
							|| l.getRoadSegmentPositionRatio() > 1.01) {
						log.info("Detected Inavlid Location Data " + l.getId()
								+ " ratio=" + l.getRoadSegmentPositionRatio());
						return false;
					}
					return true;
				})
				.map(l -> {

					//Snap Ratio
					double ratio = Math.max(Math.min(1.0, l.getRoadSegmentPositionRatio() ),0.0) ;
					
					AroRoadLocation location = new RoadLocationImpl(l
							.getLocationPoint(), ratio, l
							.getRoadSegmentClosestPoint(), l
							.getDistanceFromRoadSegmentInMeters());

					CoverageAggregateStatistic fiberCoverageStatistic = roadLocationsProperties
							.get(l);
					if (fiberCoverageStatistic != null) {
						LocationEntity le = EntityFactory.FACTORY
								.createLocationEntity(l.getId(), tlid,
										fiberCoverageStatistic);
						return new LocationEntityAssignment(le, location);
					}
					return null;

				}).filter(la -> la != null).collect(Collectors.toList());

		totalNumberOfLocations += filteredLocations.size();
		return filteredLocations;
	}

}
