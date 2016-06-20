package com.altvil.aro.service.plan.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.assigment.impl.GraphAssignmentFactoryImpl;
import com.altvil.aro.service.graph.assigment.impl.RootGraphMapping;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.impl.AroEdgeFactory;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.network.NetworkBuilder;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.service.plan.PlanException;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.route.RouteModel;
import com.altvil.aro.service.route.RoutePlaningService;
import com.altvil.aro.util.DescribeGraph;
import com.altvil.interfaces.Assignment;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.utils.StreamUtil;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Service("planService")
@Singleton
public class PlanServiceImpl implements PlanService {

	private static final Logger log = LoggerFactory
			.getLogger(PlanServiceImpl.class.getName());

	private GraphTransformerFactory transformFactory;
	private GraphNodeFactory vertexFactory;
	private RoutePlaningService routePlaningService;

	@Autowired
	@Inject
	public PlanServiceImpl(GraphTransformerFactory transformFactory,
			GraphNodeFactory vertexFactory,
			RoutePlaningService routePlaningService) {
		super();
		this.transformFactory = transformFactory;
		this.vertexFactory = vertexFactory;
		this.routePlaningService = routePlaningService;
	}

	@Override
	public Optional<CompositeNetworkModel> computeNetworkModel(
			NetworkData networkData, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
			FtthThreshholds request, GlobalConstraint globalConstraint)
			throws PlanException {
		log.info("" + "Processing Plan ");
		long startTime = System.currentTimeMillis();
		try {
			Optional<CompositeNetworkModel> networkModel = __computeNetworkNodes(
					networkData, closestFirstSurfaceBuilder, request, globalConstraint);
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
			NetworkData networkData, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
			FtthThreshholds constraints, GlobalConstraint globalConstraint)
			throws PlanException {

		NetworkModelBuilder planning = new NetworkModelBuilder();
		CompositeNetworkModel networkModel = planning.build(networkData, closestFirstSurfaceBuilder,
				constraints, globalConstraint);

		return networkModel != null ? Optional.of(networkModel) : Optional
				.empty();
	}


	private static class FiberSourceBinding implements Assignment<GraphEdgeAssignment, GraphNode> {
		
		private GraphNode graphNode ;
		private NetworkAssignment networkAssignment ;
		private GraphEdgeAssignment rootGraphAssignment ;
		private GraphMapping graphMapping ;
		
		
		@Override
		public GraphEdgeAssignment getSource() {
			return rootGraphAssignment ;
		}
		
		public void setSource(GraphEdgeAssignment source) {
			this.rootGraphAssignment = source ;
		}
		
		@Override
		public GraphNode getDomain() {
			return graphNode ;
		}
		
		public void setDomain(GraphNode vertex) {
			this.graphNode = vertex ;
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

		public CompositeNetworkModel build(final NetworkData data, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
				FtthThreshholds request, GlobalConstraint globalConstraint) {
			
			GraphNetworkModel networkModel = transformFactory
					.createGraphNetworkModel(data);

			if (!networkModel.hasLocations()) {
				// TODO make it return empty NetworkModel
				return null;
			}

			// Build simple weighted graph
			RouteModel routeModel = routePlaningService.planRoute(networkModel);

			Collection<GraphNode> roadLocations = data.getSelectedRoadLocations().stream().map((rl)->routeModel.getVertex(rl)).collect(Collectors.toList());
			
			Collection<FiberSourceBinding> possibleFiberSources = StreamUtil
					.map(data.getFiberSources(),
							fs -> {
								FiberSourceBinding fsb = new FiberSourceBinding() ;
								fsb.setSource(networkModel.getGraphEdgeAssignment(fs));
								fsb.setDomain(routeModel.getVertex(fs));
								fsb.setNetworkAssignment(fs);
								return fsb ;
							}) ;
			
			//Ensure that Only Source per vertex (this ensure constraint one vertex one source) 
			Collection<FiberSourceBinding> assignedFiberSources = StreamUtil.hash(possibleFiberSources, FiberSourceBinding::getDomain).values() ;
			
			
			Map<GraphEdgeAssignment, FiberSourceBinding> edgeMap = 
					StreamUtil.hash(assignedFiberSources, fsb -> fsb.getSource()) ;
			
			
			GraphModelBuilder<GeoSegment> modifier = transformFactory
					.modifyModel(routeModel.getModel());
			
			// Create a virtual root whose edges connect to all of the assigned fiber sources.
			GraphNode rootNode = modifier.addVirtualRoot(StreamUtil.map(assignedFiberSources, Assignment::getDomain));
			
				// Create a tree leading to each AroEdge with a value.
			
				DAGModel<GeoSegment> dag = transformFactory.createDAG(closestFirstSurfaceBuilder, modifier.build(),
						rootNode, roadLocations);

				if (dag.getEdges().isEmpty()) {
					log.warn("Unable to build DAG as no locations found on edges");
					return null;
				}
				
				restoreLocationDemands(routeModel, dag);
				
				DescribeGraph.trace(log, dag.getGraph());
						
			RootGraphMapping rootGraphMapping = transformFactory
					.createWirecenterTransformer(request)
					.apply(dag, assignedFiberSources);
			
			
			dag = dag.removeRootNode(rootNode) ;
			
			rootGraphMapping.getChildren().forEach(gm -> {
				edgeMap.get(gm.getGraphAssignment()).setGraphMapping(gm) ;
			});
			
			return new CompositeNetworkModelImpl(assignedFiberSources.stream()
				.filter(fsb -> fsb.getGraphMapping() != null)
				.map(createNetworkModelTransform(dag, (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s)))
				.collect(Collectors.toList())) ;
			
		}
	}
	
	/*
	 * Renoding moves LocationDemands within the snap distance (currently
	 * 1m) of an edge's split point into an external map. As a result, the
	 * wireCenterTransform won't know about these demands so it final plan
	 * will truncate the route to the point where it finally has a non-zero
	 * demand.
	 * 
	 * This function copies the demands into the dag such that each path in
	 * the panel will be seen as being necessary.
	 */
	private void restoreLocationDemands(RouteModel routeModel, DAGModel<GeoSegment> dag) {
		dag.getEdges().stream().forEach((e) -> {
			final Collection<GraphAssignment> graphAssignments = routeModel.getGraphAssignments(e.getSourceNode());

			final GeoSegment value = e.getValue();

			if (value != null) {
				final Collection<GraphEdgeAssignment> geoSegmentAssignments = value.getGeoSegmentAssignments();
				List<AroEntity> segmentEntities = geoSegmentAssignments.stream()
						.map(GraphEdgeAssignment::getAroEntity).collect(Collectors.toList());

				for (GraphAssignment graphAssignment : graphAssignments) {
					AroEntity graphEntity = graphAssignment.getAroEntity();

					if (segmentEntities.add(graphEntity)) {
						geoSegmentAssignments.add(GraphAssignmentFactoryImpl.FACTORY
								.createEdgeAssignment(value.pinLocation(graphAssignment.getPoint()), graphEntity));
					}
				}
			}
		});
	}

	public Function<FiberSourceBinding, NetworkModel> createNetworkModelTransform(
			DAGModel<GeoSegment> dag, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> builder) {
		return (fsb) -> 
			 new NetworkModelPlanner(fsb)
				.createNetworkModel(dag, fsb.getGraphMapping(), builder);
	}
	
	
	private class NetworkModelPlanner {

		private FiberSourceBinding fiberSourceBinding ;

		private GraphModel<GeoSegment> renodedModel;

		//
		// TODO Leaky details
		//
		private Map<GraphAssignment, GraphNode> resolved;

		public NetworkModelPlanner( FiberSourceBinding fiberSourceBinding) {
			this.fiberSourceBinding = fiberSourceBinding;
		}

		public NetworkModel createNetworkModel(DAGModel<GeoSegment> dag,
				GraphMapping graphMapping, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> builder) {
			FiberSourceMapping fiberMapping = (FiberSourceMapping) graphMapping;

			this.renodedModel = renodeGraph(dag, graphMapping);
			
			DescribeGraph.trace(log, renodedModel.getGraph());
			
			Collection<AroEdge<GeoSegment>> feederFiber = planRoute(graphMapping, builder);
			Map<GraphAssignment, Collection<AroEdge<GeoSegment>>> distributionFiber = planDistributionRoutes(graphMapping
					.getChildren(), builder);

			return new NetworkModelImpl(fiberSourceBinding.getNetworkAssignment(), null, dag, renodedModel,
					feederFiber, distributionFiber, fiberMapping, resolved);
		}

		private Collection<AroEdge<GeoSegment>> planRoute(GraphMapping mapping, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> builder) {
			return planRoute(mapping.getGraphAssignment(),
					mapping.getChildAssignments(), builder);
		}
		
		private boolean isDistributionSource(AroEntity entity) {
			return entity.getType().equals(FDHEquipment.class) ;
		}

		private Map<GraphAssignment, Collection<AroEdge<GeoSegment>>> planDistributionRoutes(
				Collection<GraphMapping> children, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> builder) {

			Map<GraphAssignment, Collection<AroEdge<GeoSegment>>> map = new HashMap<>();

			children.forEach(a -> {
				if( isDistributionSource(a.getAroEntity()) ) {
					map.put(a.getGraphAssignment(), planRoute(a, builder));
				}
			});

			return map;
		}

		private Collection<AroEdge<GeoSegment>> planRoute(GraphAssignment root,
				Collection<? extends GraphAssignment> nodes, ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> builder) {

			if (log.isDebugEnabled())
				log.debug("Processing Routes for" + root.getAroEntity());

			Collection<AroEdge<GeoSegment>> edges = new RouteBuilder<GraphNode, AroEdge<GeoSegment>>()
					.build(renodedModel.getGraph(),
							builder, resolved.get(root),
							StreamUtil.map(nodes, n -> resolved.get(n)));

			return edges;
		}

		private GraphModel<GeoSegment> renodeGraph(GraphModel<GeoSegment> gm,
				GraphMapping co) {

			if (log.isDebugEnabled())
				log.debug("renode  Graph for all assigned equipment");

			GraphModelBuilder<GeoSegment> b = transformFactory
					.createBuilder(new SimpleWeightedGraph<GraphNode, AroEdge<GeoSegment>>(
							new AroEdgeFactory<GeoSegment>()));

			NetworkBuilder networkBuilder = new NetworkBuilder(b, vertexFactory);
			networkBuilder.add(co.getGraphAssignment());

			co.getChildren().forEach(a -> {

				networkBuilder.add(a.getGraphAssignment()); // FDH
					networkBuilder.add(a.getChildAssignments()); // FDTs
				});

			networkBuilder.renodeGraph(gm);
			// TODO Move into Model Abstraction
			resolved = networkBuilder.getResolvedAssignments();
			//Update Resolved Map with FiberSource Root Binding
			this.resolved.put(fiberSourceBinding.getSource(), fiberSourceBinding.getDomain()) ;
			
			return networkBuilder.getBuilder().build();

		}

	}

}
