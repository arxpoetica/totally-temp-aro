package com.altvil.aro.service.plan.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.FDHEquipment;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.FinancialInputs;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.alg.DefaultGraphPathConstraint;
import com.altvil.aro.service.graph.alg.DistanceGraphPathConstraint;
import com.altvil.aro.service.graph.alg.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.alg.stiener.SpanningRouteBuilderFactory;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.assigment.impl.GraphAssignmentFactoryImpl;
import com.altvil.aro.service.graph.assigment.impl.RootGraphMapping;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.network.GraphRenoder;
import com.altvil.aro.service.graph.transform.network.GraphRenoderService;
import com.altvil.aro.service.graph.transform.network.RenodedGraph;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.CoreLeastCostRoutingService;
import com.altvil.aro.service.plan.GeneratedFiberRoute;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.service.plan.PlanException;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.aro.service.route.RouteModel;
import com.altvil.aro.service.route.RoutePlaningService;
import com.altvil.aro.util.DescribeGraph;
import com.altvil.interfaces.Assignment;
import com.altvil.interfaces.CableConstructionEnum;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.utils.StreamUtil;

@Service
public class CoreLeastCostRoutingServiceImpl implements
		CoreLeastCostRoutingService {

	private static final Logger log = LoggerFactory
			.getLogger(CoreLeastCostRoutingServiceImpl.class.getName());

	private GraphTransformerFactory transformFactory;
	private RoutePlaningService routePlaningService;
	private GraphRenoderService graphRenoderService;

	private GraphAssignmentFactory assignmentFactory = GraphAssignmentFactoryImpl.FACTORY;

	@Autowired
	public CoreLeastCostRoutingServiceImpl(
			GraphRenoderService graphRenoderService,
			GraphTransformerFactory transformFactory,
			RoutePlaningService routePlaningService) {
		super();
		this.graphRenoderService = graphRenoderService;
		this.transformFactory = transformFactory;
		this.routePlaningService = routePlaningService;
	}

	@Override
	public Optional<CompositeNetworkModel> computeNetworkModel(
			GraphNetworkModel model, LcrContext context) throws PlanException {
		log.info("" + "Processing Plan ");
		long startTime = System.currentTimeMillis();
		try {
			Optional<CompositeNetworkModel> networkModel = __computeNetworkNodes(
					model, context);
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

	GraphNetworkModel model, LcrContext context) throws PlanException {

		NetworkModelBuilder planning = new NetworkModelBuilder(context);
		CompositeNetworkModel networkModel = planning.build(model);

		return networkModel != null ? Optional.of(networkModel) : Optional
				.empty();
	}

	protected ClosestFirstSurfaceBuilder getDijkstrIteratorBuilder(
			FinancialInputs financialInputs) {
		return ScalarClosestFirstSurfaceIterator.BUILDER;
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

		private LcrContext lcrContext;

		public NetworkModelBuilder(LcrContext lcrContext) {
			super();
			this.lcrContext = lcrContext;
		}

		public CompositeNetworkModel build(GraphNetworkModel networkModel) {

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

			DAGModel<GeoSegment> dag = transformFactory.createDAG(lcrContext
					.getClosestFirstSurfaceBuilder(), modifier.build(),
					rootNode, e -> {
						GeoSegment gs = e.getValue();
						return gs == null ? false : !gs
								.getGeoSegmentAssignments().isEmpty();
					});

			if (dag.getEdges().isEmpty()) {
				log.warn("Unable to build DAG as no locations found on edges");
				return null;
			}

			// /restoreLocationDemands(routeModel, dag);

			DescribeGraph.trace(log, dag.getGraph());

			RootGraphMapping rootGraphMapping = transformFactory
					.createWirecenterTransformer(
							lcrContext.getFtthThreshholds()).apply(dag,
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
					.map(createNetworkModelTransform(lcrContext, graphCtx))
					.collect(Collectors.toList()));

		}
	}

	public Function<FiberSourceBinding, NetworkModel> createNetworkModelTransform(
			LcrContext lcrContext, GraphContext graphCtx) {
		return (fsb) -> new NetworkModelPlanner(lcrContext, fsb)
				.createNetworkModel(graphCtx, fsb.getGraphMapping());
	}

	private class NetworkModelPlanner {

		private PricingModel pricingModel;
		private LcrContext lcrContext;
		private FiberSourceBinding fiberSourceBinding;
		private Map<Map<CableConstructionEnum, Double>, RenodedGraph> cache = new HashMap<>();

		public NetworkModelPlanner(LcrContext lcrContex,
				FiberSourceBinding fiberSourceBinding) {
			this.lcrContext = lcrContex;
			this.pricingModel = lcrContex.getPricingModel();
			this.fiberSourceBinding = fiberSourceBinding;
		}

		private RenodedGraph getRenodedGraph(GraphContext graphCtx,
				FiberType fiberType, GraphMapping graphMapping) {

			Map<CableConstructionEnum, Double> priceMap = createPriceMap(fiberType);

			RenodedGraph renoded = cache.get(priceMap);
			if (renoded != null) {
				return renoded;
			}

			GraphRenoder renoder = graphRenoderService.createGraphRenoder(
					graphCtx.getGraphModel(), true);

			renoder.add(extractAssignments(graphMapping).values());
			renoder.add(assignmentFactory.createVertexAssignment(
					fiberSourceBinding.getDomain(), graphMapping.getAroEntity()));

			cache.put(
					priceMap,
					renoded = renoder.renode().transform(
							s -> priceMap.get(s.getCableConstructionCategory())
									* s.getLength()));

			DescribeGraph.trace(log, renoded.getGraph().getGraph());

			return renoded;

		}

		private GraphPathConstraint<GraphNode, AroEdge<GeoSegment>> createConstraint(
				FiberType fiberType) {
			Double distanceInMeters = lcrContext.getFtthThreshholds()
					.getMaxFiberLength(fiberType);

			if (distanceInMeters == null || distanceInMeters < 100) {
				return new DefaultGraphPathConstraint<GraphNode, AroEdge<GeoSegment>>();
			}

			return new DistanceGraphPathConstraint<GraphNode, AroEdge<GeoSegment>>(
					distanceInMeters);

		}

		public NetworkModel createNetworkModel(GraphContext graphCtx,
				GraphMapping graphMapping) {

			FiberSourceMapping fiberMapping = (FiberSourceMapping) graphMapping;

			Map<FiberType, RenodedGraph> renodedMap = new EnumMap<>(
					FiberType.class);
			renodedMap.put(FiberType.FEEDER,
					getRenodedGraph(graphCtx, FiberType.FEEDER, graphMapping));
			renodedMap.put(
					FiberType.DISTRIBUTION,
					getRenodedGraph(graphCtx, FiberType.DISTRIBUTION,
							graphMapping));

			// RenodedGraph rg = getRenodedGraph(graphCtx, FiberType.FEEDER,
			// graphMapping);

			GeneratedFiberRoute feederFiber = planRoute(
					createConstraint(FiberType.DISTRIBUTION),
					getRenodedGraph(graphCtx, FiberType.FEEDER, graphMapping),
					graphMapping);

			Map<GraphAssignment, GeneratedFiberRoute> distributionFiber = planDistributionRoutes(
					getRenodedGraph(graphCtx, FiberType.DISTRIBUTION,
							graphMapping), graphMapping.getChildren());

			return new NetworkRouteModel(
					fiberSourceBinding.getNetworkAssignment(), null,
					renodedMap, feederFiber, distributionFiber, fiberMapping);
		}

		private Map<CableConstructionEnum, Double> createPriceMap(
				FiberType fiberType) {
			Map<CableConstructionEnum, Double> result = new EnumMap<>(
					CableConstructionEnum.class);

			for (CableConstructionEnum ct : CableConstructionEnum.values()) {
				result.put(ct,
						pricingModel.getFiberCostPerMeter(fiberType, ct, 1));
			}

			return result;
		}

		private GeneratedFiberRoute planRoute(
				GraphPathConstraint<GraphNode, AroEdge<GeoSegment>> predicate,
				RenodedGraph renoded, GraphMapping mapping) {
			return planRoute(predicate, renoded, mapping.getGraphAssignment(),
					mapping.getChildAssignments());
		}

		private boolean isDistributionSource(AroEntity entity) {
			return entity.getType().equals(FDHEquipment.class);
		}

		private Map<GraphAssignment, GeneratedFiberRoute> planDistributionRoutes(
				RenodedGraph renoded, Collection<GraphMapping> children) {

			Map<GraphAssignment, GeneratedFiberRoute> map = new HashMap<>();

			GraphPathConstraint<GraphNode, AroEdge<GeoSegment>> constraint = createConstraint(FiberType.DISTRIBUTION);

			children.forEach(a -> {
				if (isDistributionSource(a.getAroEntity())) {
					map.put(a.getGraphAssignment(),
							planRoute(constraint, renoded, a));
				}
			});

			return map;
		}

		private GeneratedFiberRoute planRoute(
				GraphPathConstraint<GraphNode, AroEdge<GeoSegment>> predicate,
				RenodedGraph renoded, GraphAssignment root,
				Collection<? extends GraphAssignment> nodes) {

			if (log.isDebugEnabled())
				log.debug("Processing Routes for" + root.getAroEntity());

			SourceRoute<GraphNode, AroEdge<GeoSegment>> sr =  SpanningRouteBuilderFactory.FACTORY.create(
					 renoded.getGraph().getGraph(), 
					 predicate,
					 Collections.singleton(renoded.getGraphNode(root)),
					 StreamUtil.map(nodes, n -> renoded.getGraphNode(n))).build().iterator().next() ;
			
			Set<AroEdge<GeoSegment>> edges = sr.createDagModel(
					transformFactory.createDAGBuilder()).getEdges();

			return new DefaultGeneratedFiberRoute(sr.getSourceVertex(), edges);
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