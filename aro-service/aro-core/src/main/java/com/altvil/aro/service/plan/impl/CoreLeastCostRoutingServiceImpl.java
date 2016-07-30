package com.altvil.aro.service.plan.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.jgrapht.graph.SimpleWeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.alg.RouteBuilder;
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.assigment.impl.RootGraphMapping;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.impl.AroEdgeFactory;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.segment.transform.GeoSegmentTransform;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.network.GraphRenoder;
import com.altvil.aro.service.graph.transform.network.NetworkBuilder;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.CoreLeastCostRoutingService;
import com.altvil.aro.service.plan.GeneratedFiberRoute;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.service.plan.PlanException;
import com.altvil.aro.service.route.RouteModel;
import com.altvil.aro.service.route.RoutePlaningService;
import com.altvil.aro.util.DescribeGraph;
import com.altvil.interfaces.Assignment;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.utils.StreamUtil;
import com.google.inject.Inject;

@Service
public class CoreLeastCostRoutingServiceImpl implements CoreLeastCostRoutingService {

	private static final Logger log = LoggerFactory
			.getLogger(PlanServiceImpl.class.getName());

	// private static final ClosestFirstSurfaceBuilder<GraphNode,
	// AroEdge<GeoSegment>> CFSB = (
	// g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode,
	// AroEdge<GeoSegment>>(
	// g, s);

	private GraphTransformerFactory transformFactory;
	private GraphNodeFactory vertexFactory;
	private RoutePlaningService routePlaningService;

	@Autowired
	@Inject
	public CoreLeastCostRoutingServiceImpl(
			GraphTransformerFactory transformFactory,
			GraphNodeFactory vertexFactory,
			RoutePlaningService routePlaningService) {
		super();
		this.transformFactory = transformFactory;
		this.vertexFactory = vertexFactory;
		this.routePlaningService = routePlaningService;
	}

	@Override
	public Optional<CompositeNetworkModel> computeNetworkModel(
			GraphNetworkModel model, FtthThreshholds constraints)
			throws PlanException {

		log.info("" + "Processing Plan ");
		long startTime = System.currentTimeMillis();
		try {
			Optional<CompositeNetworkModel> networkModel = __computeNetworkNodes(
					model, constraints);
			log.info("Finished Processing Plan. time taken millis="
					+ (System.currentTimeMillis() - startTime));
			return networkModel;
		} catch (Throwable err) {
			log.error(err.getMessage(), err);
			log.info("Failed to Process. time taken millis="
					+ (System.currentTimeMillis() - startTime));
			throw new PlanException(err.getMessage(), err);
		}

	}

	private Optional<CompositeNetworkModel> __computeNetworkNodes(
			GraphNetworkModel model, FtthThreshholds constraints)
			throws PlanException {

		NetworkModelBuilder planning = new NetworkModelBuilder();
		CompositeNetworkModel networkModel = planning.build(model,
				constraints);

		return networkModel != null ? Optional.of(networkModel) : Optional
				.empty();
	}

	private static class FiberSourceBinding implements
			Assignment<GraphEdgeAssignment, GraphNode> {

		private GraphNode graphNode;
		private NetworkAssignment networkAssignment;
		private GraphEdgeAssignment rootGraphAssignment;
		private GraphMapping graphMapping;

		@Override
		public GraphEdgeAssignment getSource() {
			return rootGraphAssignment;
		}

		public void setSource(GraphEdgeAssignment source) {
			this.rootGraphAssignment = source;
		}

		@Override
		public GraphNode getDomain() {
			return graphNode;
		}

		public void setDomain(GraphNode vertex) {
			this.graphNode = vertex;
		}

		public NetworkAssignment getNetworkAssignment() {
			return networkAssignment;
		}

		public void setNetworkAssignment(NetworkAssignment networkAssignment) {
			this.networkAssignment = networkAssignment;
		}

		public GraphMapping getGraphMapping() {
			return graphMapping;
		}

		public void setGraphMapping(GraphMapping graphMapping) {
			this.graphMapping = graphMapping;
		}

		public String toString() {
			return ToStringBuilder.reflectionToString(this);
		}
	}

	private class NetworkModelBuilder {

		public NetworkModelBuilder() {
			super();
		}

		public CompositeNetworkModel build(GraphNetworkModel networkModel,

		FtthThreshholds request) {

			if (!networkModel.hasLocations()) {
				// TODO make it return empty NetworkModel
				return null;
			}

			// Build simple weighted graph
			RouteModel routeModel = routePlaningService.planRoute(networkModel);

			// Collection<GraphNode> roadLocations =
			// data.getSelectedRoadLocations().stream().map((rl)->routeModel.getVertex(rl)).collect(Collectors.toList());

			Collection<FiberSourceBinding> possibleFiberSources = StreamUtil
					.map(networkModel.getNetworkAssignments(), fs -> {
						FiberSourceBinding fsb = new FiberSourceBinding();
						fsb.setSource(networkModel.getGraphEdgeAssignment(fs));
						fsb.setDomain(routeModel.getVertex(fs));
						fsb.setNetworkAssignment(fs);
						return fsb;
					});

			// Ensure that Only Source per vertex (this ensure constraint one
			// vertex one source)
			Collection<FiberSourceBinding> assignedFiberSources = StreamUtil
					.hash(possibleFiberSources, FiberSourceBinding::getDomain)
					.values();

			Map<GraphEdgeAssignment, FiberSourceBinding> edgeMap = StreamUtil
					.hash(assignedFiberSources, fsb -> fsb.getSource());

			GraphModelBuilder<GeoSegment> modifier = transformFactory
					.modifyModel(routeModel.getModel());

			// Create a virtual root whose edges connect to all of the assigned
			// fiber sources.
			GraphNode rootNode = modifier.addVirtualRoot(StreamUtil.map(
					assignedFiberSources, Assignment::getDomain));

			// Create a tree leading to each AroEdge with a value.

			DAGModel<GeoSegment> dag = transformFactory.createDAG(modifier
					.build(), rootNode, e -> {
				GeoSegment gs = e.getValue();
				return gs == null ? false : !gs.getGeoSegmentAssignments()
						.isEmpty();
			});

			if (dag.getEdges().isEmpty()) {
				log.warn("Unable to build DAG as no locations found on edges");
				return null;
			}

			// /restoreLocationDemands(routeModel, dag);

			DescribeGraph.trace(log, dag.getGraph());

			RootGraphMapping rootGraphMapping = transformFactory
					.createWirecenterTransformer(request).apply(dag,
							assignedFiberSources);

			dag = dag.removeRootNode(rootNode);

			// Update Fiber Source Bindings
			rootGraphMapping.getChildren().forEach(gm -> {
				edgeMap.get(gm.getGraphAssignment()).setGraphMapping(gm);
			});

			GraphContext graphCtx = new GraphContext(dag,
					networkModel.getGraphModel());

			return new CompositeNetworkModelImpl(assignedFiberSources.stream()
					.filter(fsb -> fsb.getGraphMapping() != null)
					.map(createNetworkModelTransform(graphCtx))
					.collect(Collectors.toList()));

		}
	}

	/*
	 * Renoding moves LocationDemands within the snap distance (currently 1m) of
	 * an edge's split point into an external map. As a result, the
	 * wireCenterTransform won't know about these demands so it final plan will
	 * truncate the route to the point where it finally has a non-zero demand.
	 * 
	 * This function copies the demands into the dag such that each path in the
	 * panel will be seen as being necessary.
	 */
	// private void restoreLocationDemands(RouteModel routeModel,
	// DAGModel<GeoSegment> dag) {
	// dag.getEdges()
	// .stream()
	// .forEach(
	// (e) -> {
	// final Collection<GraphAssignment> graphAssignments = routeModel
	// .getGraphAssignments(e.getSourceNode());
	//
	// final GeoSegment value = e.getValue();
	//
	// if (value != null) {
	// final Collection<GraphEdgeAssignment> geoSegmentAssignments = value
	// .getGeoSegmentAssignments();
	// List<AroEntity> segmentEntities = geoSegmentAssignments
	// .stream()
	// .map(GraphEdgeAssignment::getAroEntity)
	// .collect(Collectors.toList());
	//
	// for (GraphAssignment graphAssignment : graphAssignments) {
	// AroEntity graphEntity = graphAssignment
	// .getAroEntity();
	//
	// if (segmentEntities.add(graphEntity)) {
	// geoSegmentAssignments
	// .add(GraphAssignmentFactoryImpl.FACTORY.createEdgeAssignment(
	// value.pinLocation(graphAssignment
	// .getPoint()),
	// graphEntity));
	// }
	// }
	// }
	// });
	// }

	public Function<FiberSourceBinding, NetworkModel> createNetworkModelTransform(
			GraphContext graphCtx) {
		return (fsb) -> new NetworkModelPlanner(fsb).createNetworkModel(
				graphCtx, fsb.getGraphMapping());
	}

	private class NetworkModelPlanner {

		private FiberSourceBinding fiberSourceBinding;

		private GraphModel<GeoSegment> renodedModel;

		//
		// TODO Leaky details
		//
		private Map<GraphAssignment, GraphNode> resolved;

		public NetworkModelPlanner(FiberSourceBinding fiberSourceBinding) {
			this.fiberSourceBinding = fiberSourceBinding;
		}

		public NetworkModel createNetworkModel(GraphContext graphCtx,
				GraphMapping graphMapping) {
			FiberSourceMapping fiberMapping = (FiberSourceMapping) graphMapping;

			this.renodedModel = renodeGraph(graphCtx, graphMapping);

			DescribeGraph.trace(log, renodedModel.getGraph());

			GeneratedFiberRoute feederFiber = planRoute(graphMapping);
			Map<GraphAssignment, GeneratedFiberRoute> distributionFiber = planDistributionRoutes(graphMapping
					.getChildren());

			return new NetworkRouteModel(
					fiberSourceBinding.getNetworkAssignment(), null,
					graphCtx.getGraphModel(), renodedModel, feederFiber,
					distributionFiber, fiberMapping, resolved);
		}

		private GeneratedFiberRoute planRoute(GraphMapping mapping) {
			return planRoute(mapping.getGraphAssignment(),
					mapping.getChildAssignments());
		}

		private boolean isDistributionSource(AroEntity entity) {
			return entity.getType().equals(FDHEquipment.class);
		}

		private Map<GraphAssignment, GeneratedFiberRoute> planDistributionRoutes(
				Collection<GraphMapping> children) {

			Map<GraphAssignment, GeneratedFiberRoute> map = new HashMap<>();

			children.forEach(a -> {
				if (isDistributionSource(a.getAroEntity())) {
					map.put(a.getGraphAssignment(), planRoute(a));
				}
			});

			return map;
		}

		private GeneratedFiberRoute planRoute(GraphAssignment root,
				Collection<? extends GraphAssignment> nodes) {

			if (log.isDebugEnabled())
				log.debug("Processing Routes for" + root.getAroEntity());

			SourceRoute<GraphNode, AroEdge<GeoSegment>> sr = new RouteBuilder<GraphNode, AroEdge<GeoSegment>>()
					.buildSourceRoute(renodedModel.getGraph(),
							resolved.get(root),
							StreamUtil.map(nodes, n -> resolved.get(n)));

			Set<AroEdge<GeoSegment>> edges = sr.createDagModel(
					transformFactory.createDAGBuilder()).getEdges();

			return new DefaultGeneratedFiberRoute(sr.getSourceVertex(), edges);
		}

		private String toName(PinnedLocation pl) {

			GeoSegmentTransform gt = pl.getGeoSegment().getParentTransform();
			if (gt == null) {
				return "IDENTITY";
			}

			return gt.getClass().getSimpleName();

		}

		private void verifyAssignments(Map<GraphAssignment, GraphNode> map,
				Map<GraphEdgeAssignment, GraphEdgeAssignment> assignmentMap) {
			int count = 0;

			for (Map.Entry<GraphAssignment, GraphNode> e : map.entrySet()) {
				if (e.getValue() == null) {

					GraphEdgeAssignment ge = (GraphEdgeAssignment) e.getKey();
					GraphEdgeAssignment originalAssignment = assignmentMap
							.get(ge);
					String transform = toName(originalAssignment
							.getPinnedLocation());

					count++;
					log.error("Failed Assignment Length = "
							+ ge.getGeoSegment().getLength() + " gid= "
							+ ge.getGeoSegment().getGid() + " id=" + " name = "
							+ transform
							+ +System.identityHashCode(ge.getGeoSegment()));
				}
			}

			if (count > 0) {
				throw new RuntimeException("Failed assign all vertices");
			}

		}

		private Map<GraphEdgeAssignment, GraphEdgeAssignment> extractAssignments(
				GraphMapping co) {
			Map<GraphEdgeAssignment, GraphEdgeAssignment> assignmentMap = new HashMap<>();
			assignmentMap.put(co.getGraphAssignment(), co.getGraphAssignment());
			co.getChildren().forEach(
					a -> {
						assignmentMap.put(a.getGraphAssignment(),
								a.getGraphAssignment());
						a.getChildAssignments().forEach(
								ge -> assignmentMap.put(ge, ge));

					});
			return assignmentMap;
		}

		private GraphModel<GeoSegment> renodeGraph(GraphContext graphCtx,
				GraphMapping co) {

			if (log.isDebugEnabled())
				log.debug("renode  Graph for all assigned equipment");

			GraphModelBuilder<GeoSegment> b = transformFactory
					.createBuilder(new SimpleWeightedGraph<GraphNode, AroEdge<GeoSegment>>(
							new AroEdgeFactory<GeoSegment>()));

			GraphRenoder networkBuilder = new NormalizedRenoder(
					new NetworkBuilder(b, vertexFactory));

			Map<GraphEdgeAssignment, GraphEdgeAssignment> assignmentMap = extractAssignments(co);

			assignmentMap.put(co.getGraphAssignment(), co.getGraphAssignment());

			networkBuilder.add(assignmentMap.values());
			networkBuilder.renodeGraph(graphCtx.getGraphModel());

			// TODO Move into Model Abstraction
			resolved = networkBuilder.getResolvedAssignments();

			verifyAssignments(resolved, assignmentMap);

			// Update Resolved Map with FiberSource Root Binding
			this.resolved.put(fiberSourceBinding.getSource(),
					fiberSourceBinding.getDomain());

			return networkBuilder.getBuilder().build();

		}

	}

	private class GraphContext {
		private DAGModel<GeoSegment> dagModel;
		private GraphModel<GeoSegment> graphModel;

		public GraphContext(DAGModel<GeoSegment> dagModel,
				GraphModel<GeoSegment> graphModel) {
			super();
			this.dagModel = dagModel;
			this.graphModel = graphModel;
		}

		@SuppressWarnings("unused")
		public DAGModel<GeoSegment> getDagModel() {
			return dagModel;
		}

		public GraphModel<GeoSegment> getGraphModel() {
			return graphModel;
		}

	}

}