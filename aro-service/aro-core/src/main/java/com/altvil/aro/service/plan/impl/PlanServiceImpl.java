package com.altvil.aro.service.plan.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.jgrapht.WeightedGraph;
import org.jgrapht.graph.SimpleWeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.alg.RouteBuilder;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.assigment.impl.FiberSourceMapping;
import com.altvil.aro.service.graph.assigment.impl.RootGraphMapping;
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
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.aro.service.plan.PlanException;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.route.RouteModel;
import com.altvil.aro.service.route.RoutePlaningService;
import com.altvil.interfaces.Assignment;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.utils.StreamUtil;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Service
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
			NetworkData networkData, FiberNetworkConstraints request)
			throws PlanException {
		log.info("" + "Processing Plan ");
		long startTime = System.currentTimeMillis();
		try {
			Optional<CompositeNetworkModel> networkModel = __computeNetworkNodes(
					networkData, request);
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
			NetworkData networkData, FiberNetworkConstraints request)
			throws PlanException {

		NetworkModelBuilder planning = new NetworkModelBuilder();
		CompositeNetworkModel networkModel = planning.build(networkData,
				request);

		return networkModel != null ? Optional.of(networkModel) : Optional
				.empty();
	}

	@Override
	public FtthThreshholds createFtthThreshholds(FiberNetworkConstraints rr) {
		
		if( rr == null ) {
			rr = new FiberNetworkConstraints() ;
		}
		
		return FtthThreshholds
				.build()
				.setDropCableInFeet(rr.getDropCableLengthInFeet())
				.setPrefferedOffsetInFeet(rr.getPreferredCableLengthInFeet())
				.setMaxOffsetInFeet(rr.getMaxDistrubitionLengthInFeet())
				.setMaxSplitters(rr.getMaxSplitters())
				.setMinSplitters(rr.getMinSplitters())
				.setIdealSplitters(rr.getIdealSplitters())
				.setFdtCount(rr.getFdtCount())
				.setClusterMergingSupported(rr.getClusterMergingSupported())
				.setDropCableConstraintsSupported(
						rr.getDropCableConstraintsSupported())
				.setSplitterRatio(rr.getSplitterRatio()).build();
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
		
	}

	private class NetworkModelBuilder {

			
		public NetworkModelBuilder() {
			super();
		}

		public CompositeNetworkModel build(NetworkData data,
				FiberNetworkConstraints request) {
			
			GraphNetworkModel networkModel = transformFactory
					.createGraphNetworkModel(data);

			if (!networkModel.hasLocations()) {
				// TODO make it return empty NetworkModel
				return null;
			}

			// Causes Graph to be Re-nodded
			RouteModel routeModel = routePlaningService.planRoute(networkModel);

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
			Map<GraphNode, FiberSourceBinding> bindingMap = StreamUtil.hash(possibleFiberSources, FiberSourceBinding::getDomain) ;
			Collection<FiberSourceBinding> assignedFiberSources = bindingMap.values() ;
			
			Map<GraphEdgeAssignment, FiberSourceBinding> edgeMap = 
					StreamUtil.hash(assignedFiberSources, fsb -> fsb.getSource()) ;
			
			
			GraphModelBuilder<GeoSegment> modifier = transformFactory
					.modifyModel(routeModel.getModel());
			
			GraphNode rootNode = modifier.addVirtualRoot(StreamUtil.map(assignedFiberSources, Assignment::getDomain));
			
			DAGModel<GeoSegment> dag = transformFactory.createDAG(modifier.build(), rootNode, e -> e.getValue() != null && !e.getValue().isEmpty());

			if (dag.getEdges().isEmpty()) {
				log.warn("Unable to build DAG as no locations found on edges");
				return null;
			}
			
			
			RootGraphMapping rootGraphMapping = transformFactory
					.createWirecenterTransformer(createFtthThreshholds(request))
					.apply(dag, assignedFiberSources);
			
			
			dag = dag.removeRootNode(rootNode) ;
			
			rootGraphMapping.getChildren().forEach(gm -> {
				edgeMap.get(gm.getGraphAssignment()).setGraphMapping(gm) ;
			});
			

			return new CompositeNetworkModelImpl(assignedFiberSources.stream()
				.filter(fsb -> fsb.getGraphMapping() != null)
				.map(createNetworkModelTransform(dag))
				.collect(Collectors.toList())) ;
			
		}

	}
	
	

	public Function<FiberSourceBinding, NetworkModel> createNetworkModelTransform(
			DAGModel<GeoSegment> dag) {
		return (fsb) -> 
			 new NetworkModelPlanner(fsb)
				.createNetworkModel(dag, fsb.getGraphMapping());
	}
	
	
	private class NetworkModelPlanner {

		private FiberSourceBinding fiberSourceBinding ;

		private GraphModel<GeoSegment> renodedModel;

		//
		// TODO Leaky details
		//
		private Map<GraphAssignment, GraphNode> resolved;

		public NetworkModelPlanner( FiberSourceBinding fiberSourceBinding) {
			super();
			this.fiberSourceBinding = fiberSourceBinding;
		}

		public NetworkModel createNetworkModel(DAGModel<GeoSegment> dag,
				GraphMapping graphMapping) {

			FiberSourceMapping fiberMapping = (FiberSourceMapping) graphMapping;

			this.renodedModel = renodeGraph(dag, graphMapping);
			
			Collection<AroEdge<GeoSegment>> feederFiber = planRoute(graphMapping);
			Map<GraphAssignment, Collection<AroEdge<GeoSegment>>> distributionFiber = planDistributionRoutes(graphMapping
					.getChildren());

			return new NetworkModelImpl(fiberSourceBinding.getNetworkAssignment(), null, dag, renodedModel,
					feederFiber, distributionFiber, fiberMapping, resolved);
		}

		private Collection<AroEdge<GeoSegment>> planRoute(GraphMapping mapping) {
			return planRoute(mapping.getGraphAssignment(),
					mapping.getChildAssignments());
		}

		private Map<GraphAssignment, Collection<AroEdge<GeoSegment>>> planDistributionRoutes(
				Collection<GraphMapping> children) {

			Map<GraphAssignment, Collection<AroEdge<GeoSegment>>> map = new HashMap<>();

			children.forEach(a -> {
				map.put(a.getGraphAssignment(), planRoute(a));
			});

			return map;
		}

		@SuppressWarnings({ "rawtypes", "unchecked" })
		private Collection<AroEdge<GeoSegment>> planRoute(GraphAssignment root,
				Collection<? extends GraphAssignment> nodes) {

			if (log.isDebugEnabled())
				log.debug("Processing Routes for" + root.getAroEntity());

			Collection<AroEdge<GeoSegment>> edges = new RouteBuilder<GraphNode, AroEdge<GeoSegment>>()
					.build((WeightedGraph) renodedModel.getGraph(),
							resolved.get(root),
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
