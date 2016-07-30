package com.altvil.aro.service.graph.builder.impl;

import static java.util.stream.Collectors.groupingBy;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.builder.GraphBuilderService;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.builder.RoadEdgeInfo;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.segment.AroRoadLocation;
import com.altvil.aro.service.graph.segment.CableConstruction;
import com.altvil.aro.service.graph.segment.RatioSection;
import com.altvil.aro.service.graph.segment.impl.DefaultGeoRatioSection;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations.LocationEntityAssignment;
import com.altvil.aro.service.graph.segment.impl.RoadLocationImpl;
import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.StreamUtil;

public class GraphBuilderServiceImpl implements GraphBuilderService {

	private static final Logger log = LoggerFactory
			.getLogger(GraphBuilderServiceImpl.class.getName());

	@Override
	public GraphNetworkModel createGraphNetworkModel(NetworkData networkData,
			Function<CableConduitEdge, RatioSection> fToRatioSection) {

		Iterator<RoadEdgeInfo> itr = createRoadEdgeInfoItr(networkData,
				fToRatioSection);

		return null;
	}

	private Iterator<RoadEdgeInfo> createRoadEdgeInfoItr(
			NetworkData networkData,
			Function<CableConduitEdge, RatioSection> fToRatioSection) {

		RoadEdgeInfoImpl rei = new RoadEdgeInfoImpl(fToRatioSection,
				new RoadEdgeIndexer().index(networkData));

		Iterator<RoadEdge> itr = networkData.getRoadEdges().iterator();

		return new Iterator<RoadEdgeInfo>() {

			@Override
			public boolean hasNext() {
				return itr.hasNext();
			}

			@Override
			public RoadEdgeInfo next() {
				return rei.update(itr.next());
			}

		};

	}

	private class RoadEdgeInfoImpl implements RoadEdgeInfo {

		private Function<CableConduitEdge, RatioSection> fToRatioSection;
		private RoadEdgeIndexer indexer;

		private Collection<RatioSection> defaultRatioSections;
		private CableConstruction defaultCableConstruction;

		private RoadEdge roadEdge;
		private Long id;

		public RoadEdgeInfoImpl(
				Function<CableConduitEdge, RatioSection> fToRatioSection,
				RoadEdgeIndexer indexer) {
			super();
			this.fToRatioSection = fToRatioSection;
			this.indexer = indexer;
		}

		public RoadEdgeInfo update(RoadEdge roadEdge) {
			this.roadEdge = roadEdge;
			this.id = roadEdge.getId();

			return this;
		}

		@Override
		public RoadEdge getRoadEdge() {
			return roadEdge;
		}

		@Override
		public Collection<RatioSection> getSections() {
			return normalize(indexer.getConduitEdges(id));
		}

		private Collection<RatioSection> normalize(
				Collection<CableConduitEdge> sections) {

			if (sections == null || sections.size() == 0) {
				return defaultRatioSections;
			}

			List<RatioSection> result = new ArrayList<>();
			double previous = 0;
			for(CableConduitEdge s : sections) {
				double startRatio = s.getStartRatio();
				if (startRatio > previous) {
					result.add(new DefaultGeoRatioSection(previous, startRatio,
							defaultCableConstruction));
				}
				result.add(fToRatioSection.apply(s));
				previous = s.getEndRatio() ;
			}
			if (previous < 1.0) {
				result.add(new DefaultGeoRatioSection(previous, 1.0,
						defaultCableConstruction));
			}

			return result;
		}

		@Override
		public Collection<LocationEntityAssignment> getOrderedLocations() {
			return GraphBuilderServiceImpl.this
					.getOrderedLocationsByRoadEdge(indexer.getRoadLocations(id));

		}

		@Override
		public Collection<NetworkAssignment> getNetworkAssignments() {
			Collection<NetworkAssignment> result = indexer.getFiberSources(id);
			return result == null ? Collections.emptyList() : result;
		}

	}

	private List<LocationEntityAssignment> getOrderedLocationsByRoadEdge(
			List<NetworkAssignment> result) {

		if (result == null) {
			return Collections.emptyList();
		}

		Collections.sort(result, (l1, l2) -> Double.compare(l1.getDomain()
				.getRoadSegmentPositionRatio(), l2.getDomain()
				.getRoadSegmentPositionRatio()));

		List<LocationEntityAssignment> filteredLocations = result
				.stream()
				.filter(l -> {
					if (l.getDomain().getRoadSegmentPositionRatio() < -0.01
							|| l.getDomain().getRoadSegmentPositionRatio() > 1.01) {
						log.info("Detected Inavlid Location Data "
								+ l.getSource().getObjectId() + " ratio="
								+ l.getDomain().getRoadSegmentPositionRatio());
						return false;
					}
					return true;
				})
				.map(l -> {

					// Snap Ratio
					double ratio = Math.max(Math.min(1.0, l.getDomain()
							.getRoadSegmentPositionRatio()), 0.0);

					RoadLocation domain = l.getDomain();

					AroRoadLocation location = new RoadLocationImpl(domain
							.getLocationPoint(), ratio, domain
							.getRoadSegmentClosestPoint(), domain
							.getDistanceFromRoadSegmentInMeters());

					return new LocationEntityAssignment((LocationEntity) l
							.getSource(), location);

				}).collect(Collectors.toList());

		return filteredLocations;
	}

	private static class RoadEdgeIndexer {

		private Map<Long, List<NetworkAssignment>> roadLocationsByTlid = new HashMap<>();
		private Map<Long, List<NetworkAssignment>> fiberSources;
		private Map<Long, List<CableConduitEdge>> cableConduitMap;

		public RoadEdgeIndexer index(NetworkData networkData) {

			roadLocationsByTlid = groupLocationsByTlid(networkData
					.getRoadLocations());
			fiberSources = groupFiberSources(networkData.getFiberSources());
			cableConduitMap = groupSections(networkData.getCableConduitEdges());

			return this;
		}

		public List<NetworkAssignment> getRoadLocations(Long id) {
			return roadLocationsByTlid.get(id);
		}

		public List<NetworkAssignment> getFiberSources(Long id) {
			return fiberSources.get(id);
		}

		public List<CableConduitEdge> getConduitEdges(Long id) {
			return cableConduitMap.get(id);
		}

		private Map<Long, List<CableConduitEdge>> groupSections(
				Collection<CableConduitEdge> conduitEdges) {
			return conduitEdges.stream().collect(
					Collectors.groupingBy(CableConduitEdge::getEdgeId));
		}

		private Map<Long, List<NetworkAssignment>> groupFiberSources(
				Collection<NetworkAssignment> networkAssignments) {
			return networkAssignments.stream().collect(
					groupingBy(NetworkAssignment::getRoadSegmentId));
		}

		private Map<Long, List<NetworkAssignment>> groupLocationsByTlid(
				Collection<NetworkAssignment> locations) {
			return locations.stream().filter(this::hasFiberDemand)
					.collect(groupingBy(a -> a.getDomain().getTlid()));
		}

		private boolean hasFiberDemand(NetworkAssignment roadLocation) {

			LocationEntity locationEntity = (LocationEntity) roadLocation
					.getSource();
			LocationDemand coverageAggregateStatistic = locationEntity
					.getLocationDemand();

			return coverageAggregateStatistic != null
					&& coverageAggregateStatistic.getAtomicUnits() > 0;

		}

	}

}
