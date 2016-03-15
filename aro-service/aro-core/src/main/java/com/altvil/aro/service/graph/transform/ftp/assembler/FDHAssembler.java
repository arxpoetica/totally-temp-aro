package com.altvil.aro.service.graph.transform.ftp.assembler;

import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.DefaultGraphMapping;
import com.altvil.aro.service.graph.assigment.impl.GraphAssignmentFactoryImpl;
import com.altvil.aro.service.graph.assigment.impl.LeafGraphMapping;
import com.altvil.aro.service.graph.impl.DagModelUtils;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.ftp.LocationStreamVisitor;
import com.altvil.aro.service.graph.transform.ftp.cluster.DefaultLocationClusterGroup;
import com.altvil.aro.service.graph.transform.ftp.cluster.LocationCluster;
import com.altvil.aro.service.graph.transform.ftp.cluster.LocationClusterGroup;
import com.altvil.aro.service.graph.transform.ftp.tree.EdgeStream;
import com.altvil.aro.service.graph.transform.ftp.tree.LocationStream;
import com.altvil.aro.service.graph.transform.ftp.tree.VertexStream;
import com.altvil.aro.util.algo.DefaultValueItem;
import com.altvil.aro.util.algo.Knapsack.ValuedItem;
import com.altvil.utils.StreamUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

public class FDHAssembler {

	private static final Logger log = LoggerFactory
			.getLogger(FDHAssembler.class.getName());

	private EntityFactory entityFactory = EntityFactory.FACTORY;
	private GraphAssignmentFactory assignmentFactory = GraphAssignmentFactoryImpl.FACTORY;

	private DAGModel<GeoSegment> dagModel;

	private FtthThreshholds threshHolds;

	private List<LocationClusterGroup> clusterGroups = new ArrayList<>();
	private GraphEdgeAssignment rootAssignment;

	public FDHAssembler(DAGModel<GeoSegment> dagModel,
			FtthThreshholds threshHolds) {
		super();
		this.dagModel = dagModel;
		this.threshHolds = threshHolds;
	}

	public GraphMapping createMapping(LocationStream ls) {

		FDHEquipment fdh = entityFactory.createFdh(null, threshHolds.getHubModel().computeNumberOfSplitters(ls.getLocationDemand()));
		
		ls.accept(new LocationStreamVisitor() {
			@Override
			public void visit(VertexStream vertexStream) {
				cluster(vertexStream);
				rootAssignment = assignmentFactory.createEdgeAssignment(
						DagModelUtils.createPinnedLocation(dagModel,
								vertexStream.getVertex()), fdh);

			}

			@Override
			public void visit(EdgeStream edgeStream) {
				LocationClusterGroup lcg = cluster(edgeStream);
				clusterGroups.add(lcg);

				rootAssignment = (lcg.getLastCluster() == null || lcg.getLastCluster().getPinnedLocation() == null) ? assignmentFactory
						.createEdgeAssignment(edgeStream.getGeoSegment()
								.pinLocation(0.0), fdh) : assignmentFactory
						.createEdgeAssignment(lcg.getLastCluster()
								.getPinnedLocation(), fdh);

			}
		});

		Collection<LocationCluster> fdtClusters = getLocationClusters();

		List<GraphMapping> fdtMapping = StreamUtil.map(
				fdtClusters,
				c -> {
					
					Collection<GraphEdgeAssignment> dropCableAssignments = assignOffsets(c) ;
					Collection<LocationDropAssignment> locationDrops = 
							StreamUtil.map(dropCableAssignments, a -> (LocationDropAssignment) a.getAroEntity()) ;
					
					return new LeafGraphMapping(assignmentFactory
						.createEdgeAssignment(c.getPinnedLocation(),
								entityFactory.createFdt(null, locationDrops)),
								dropCableAssignments);  });

		if (log.isDebugEnabled())
			log.debug("generated fdts " + fdtMapping.size());

		return new DefaultGraphMapping(rootAssignment, fdtMapping);

	}

	private Collection<GraphEdgeAssignment> assignOffsets(LocationCluster lc) {

		PinnedLocation fdt = lc.getPinnedLocation();
		return StreamUtil.map(
				lc.getLocations(),
				a -> {
					PinnedLocation pl = a.getPinnedLocation();
					double dropLength = Math.abs(fdt.offsetFrom(pl))
							+ pl.getDistanceFromIntersectionPoint();

					LocationEntity locationEntity = a.getLocationEntity() ;
					return GraphAssignmentFactoryImpl.FACTORY.createEdgeAssignment(
							a.getPinnedLocation(),
							EntityFactory.FACTORY.createDropAssignment(
									locationEntity,
									dropLength,
									threshHolds.getDropCableModel().getDropCable(dropLength),
									a.getTotalDemand()
							));

				});

	}

	private Collection<LocationCluster> getLocationClusters() {
		return clusterGroups
					.stream()
					.flatMap(cg -> cg.getAggregates().stream())
					.filter(lc -> !lc.isEmpty())
					.collect(Collectors.toList()) ;
	}

	private LocationClusterGroup cluster(EdgeStream edgeStream) {

		LocationClusterGroup clusters = DefaultLocationClusterGroup.create(
				edgeStream.getEdgeList(), threshHolds);

		cluster(clusters, edgeStream.getVertexStream());

		return clusters;
	}

	private void cluster(VertexStream vs) {
		cluster(DefaultLocationClusterGroup.EMPTY_CLUSTER, vs);
	}

	private void cluster(LocationClusterGroup outgoingClusters, VertexStream vs) {

		List<LocationClusterGroup> incommingClusters = StreamUtil.map(
				vs.getIncommingStreams(), s -> cluster(s));

		//
		// TODO move to strategy Pattern + Factory
		//
		if (outgoingClusters.supportsIncommingCluster()) {
			new ClusterMerger().merge(outgoingClusters, incommingClusters);
		}

		clusterGroups.addAll(incommingClusters);

	}

	//
	// TODO improve algorithms (this is 0.1)
	//
	private class ClusterMerger {

		private LocationClusterGroup outgoingCluster;
		private Map<ValuedItem, LocationClusterGroup> partialClusters = new HashMap<>();

		public void merge(LocationClusterGroup outgoingCluster,
				List<LocationClusterGroup> incommingClusters) {

			if (incommingClusters.size() == 0) {
				return;
			}

			this.outgoingCluster = outgoingCluster;

			incommingClusters
					.stream()
					.filter(cg -> isPartial(cg.getLastCluster()))
					.collect(Collectors.toList())
					.forEach(
							pg -> {
								partialClusters.put(
										new DefaultValueItem((int) Math.ceil(pg
												.getLastCluster()
												.getLocationCount())), pg);
							});
			reduce(partialClusters);

		}

		private void merge(Map<ValuedItem, LocationClusterGroup> map,
				Collection<ValuedItem> streams) {

			List<LocationClusterGroup> merged = StreamUtil.map(new ArrayList<>(
					streams), s -> map.remove(s));
			for (LocationClusterGroup lgc : merged) {
				outgoingCluster.addIncommingCluster(lgc.removePartialCluster());
			}
		}

		private void simpleMerge(Map<ValuedItem, LocationClusterGroup> map,
				Collection<ValuedItem> streams) {
			merge(map, streams);
		}

		private void reduce(Map<ValuedItem, LocationClusterGroup> map) {

			if (map.size() == 0) {
				return;
			} else if (map.size() == 1) {
				simpleMerge(map, map.keySet());
			} else {
				merge(map, map.keySet());
			}

		}

		private boolean isPartial(LocationCluster lc) {
			return lc != null
					&& lc.getLocationCount() <= threshHolds
							.getThreshHoldClusteringFDT()
					&& lc.getLongestDistanceToEndVertex() <= threshHolds
							.getPreferredDropCableLengthInMeters();
		}

	}

}
