package com.altvil.aro.service.graph.builder.impl;

import static java.util.stream.Collectors.groupingBy;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.assigment.impl.GraphAssignmentFactoryImpl;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.builder.RoadEdgeInfo;
import com.altvil.aro.service.graph.model.EdgeData;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.AroRoadLocation;
import com.altvil.aro.service.graph.segment.RatioSection;
import com.altvil.aro.service.graph.segment.impl.DefaultGeoRatioSection;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations.LocationEntityAssignment;
import com.altvil.aro.service.graph.segment.impl.RoadLocationImpl;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;

@Service
public class CoreGraphBuilderServiceImpl implements
		CoreGraphNetworkModelService {

	private static final Logger log = LoggerFactory
			.getLogger(CoreGraphBuilderServiceImpl.class.getName());

	
	private GraphAssignmentFactory graphEdgeFactory = GraphAssignmentFactoryImpl.FACTORY ;

	
	private GraphTransformerFactory transformFactory;
	private GraphNodeFactory vertexFactory;
	
	private Collection<RatioSection> DEFAULT_SECTIONS ;
	
	// //

	@Autowired
	public CoreGraphBuilderServiceImpl(
			GraphTransformerFactory transformFactory,
			GraphNodeFactory vertexFactory) {
		super();
		this.transformFactory = transformFactory;
		this.vertexFactory = vertexFactory;
		
		DEFAULT_SECTIONS = Collections.singleton(new DefaultGeoRatioSection(0, 1, CableConstructionEnum.ESTIMATED)) ;
		
	}

	private GraphNetworkModel create(Iterator<RoadEdgeInfo> itr,
			Collection<NetworkAssignment> allAssignments, GraphBuilderContext ctx) {

		CoreGraphNetworkModelBuilder nb = new CoreGraphNetworkModelBuilder(
				graphEdgeFactory, vertexFactory,
				transformFactory.createGraphBuilder(), allAssignments);

		while (itr.hasNext()) {
			nb.add(itr.next());
		}
		
		return nb.build();
	}

	@Override
	public GraphNetworkModel createGraphNetworkModel(NetworkData networkData,
			GraphBuilderContext ctx) {
		return create(createRoadEdgeInfoItr(networkData, ctx), networkData.getRoadLocations().getAllAssignments(), ctx);
	}

	@Override
	public GraphNetworkModel createGraphNetworkModel(EdgeData edgeData,
			GraphBuilderContext ctx) {
		return create(createRoadEdgeInfoItr(edgeData, ctx), Collections.emptyList(), ctx);
	}

	private Iterator<RoadEdgeInfo> createRoadEdgeInfoItr(EdgeData edgeData,
			GraphBuilderContext ctx) {
		return null;
	}

	private Iterator<RoadEdgeInfo> createRoadEdgeInfoItr(
			NetworkData networkData, GraphBuilderContext ctx) {

		RoadEdgeInfoImpl rei = new RoadEdgeInfoImpl(ctx,
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

		private GraphBuilderContext ctx;
		private RoadEdgeIndexer indexer;

		private Collection<RatioSection> defaultRatioSections = DEFAULT_SECTIONS ;
		
		private RoadEdge roadEdge;
		private Long id;

		public RoadEdgeInfoImpl(GraphBuilderContext ctx, RoadEdgeIndexer indexer) {
			super();
			this.ctx = ctx;
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

			List<CableConduitEdge> sortedEdges = new ArrayList<>(sections.size()) ;
			sortedEdges.addAll(sections) ;
			sortedEdges.sort((c1, c2) -> Double.compare(c1.getStartRatio(), c2.getStartRatio()));
			
			List<RatioSection> result = new ArrayList<>();
			double previous = 0;
		
			for (CableConduitEdge s : sortedEdges) {
				double startRatio = s.getStartRatio();
				if (startRatio > previous) {
					result.add(new DefaultGeoRatioSection(previous, startRatio,
							CableConstructionEnum.ESTIMATED));
				}
				result.add(ctx.convert(s));
				previous = s.getEndRatio();
			}
			if (previous < 1.0) {
				result.add(new DefaultGeoRatioSection(previous, 1.0,
						CableConstructionEnum.ESTIMATED));
			}

			return result;
		}

		@Override
		public Collection<LocationEntityAssignment> getOrderedLocations() {
			return CoreGraphBuilderServiceImpl.this
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
					.getRoadLocations().getSelectedAssignments());
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
