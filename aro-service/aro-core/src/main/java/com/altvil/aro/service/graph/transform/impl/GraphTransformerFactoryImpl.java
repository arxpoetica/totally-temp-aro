package com.altvil.aro.service.graph.transform.impl;

import java.util.Collection;
import java.util.function.Predicate;

import org.jgrapht.EdgeFactory;
import org.jgrapht.WeightedGraph;
import org.jgrapht.graph.SimpleDirectedWeightedGraph;
import org.jgrapht.graph.SimpleWeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.demand.EntityDemandService;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.assigment.impl.GraphAssignmentFactoryImpl;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.builder.RoadModelBuilder;
import com.altvil.aro.service.graph.builder.impl.DefaultGraphBuilder;
import com.altvil.aro.service.graph.impl.AroEdgeFactory;
import com.altvil.aro.service.graph.impl.DagBuilder;
import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.FiberDagScanner;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.network.NetworkBuilder;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Service
@Singleton
public class GraphTransformerFactoryImpl implements GraphTransformerFactory {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(GraphTransformerFactoryImpl.class.getName());
	
	private GraphNodeFactory factory;
	private EntityDemandService entityDemandService ;
	
	@Autowired
	@Inject
	public GraphTransformerFactoryImpl(GraphNodeFactory factory, EntityDemandService entityDemandService) {
		this.factory = factory;
		this.entityDemandService = entityDemandService ;
	}
	
	@Override
	public <T> GraphModelBuilder<T> modifyModel(GraphModel<T> model) {
		AroEdgeFactory<T> f = new AroEdgeFactory<T>() ;
		return new DefaultGraphBuilder<T>(factory,
				model.getGraph(), f);
	}

	@Override
	public FiberDagScanner createWirecenterTransformer(FtthThreshholds threshholds) {
		return new FiberDagScanner(entityDemandService.createDemandAnalyizer(threshholds), threshholds);
	}

	@Override
	public <T> GraphModelBuilder<T> createDAGBuilder() {
		return createDAGBuilder(new AroEdgeFactory<T>());
	}

	@Override
	public <T> GraphModelBuilder<T> createBuilder(
			WeightedGraph<GraphNode, AroEdge<T>> graph) {
		return new DefaultGraphBuilder<T>(factory, graph, new AroEdgeFactory<T>());
	}
	
	
	@Override
	public GraphModelBuilder<GeoSegment> createGraphBuilder() {
		AroEdgeFactory<GeoSegment> f = new AroEdgeFactory<GeoSegment>() ;
		return new DefaultGraphBuilder<GeoSegment>(factory,
				new SimpleWeightedGraph<GraphNode, AroEdge<GeoSegment>>(f), f);
	}

	@Override
	public <T> GraphModelBuilder<T> createDAGBuilder(
			EdgeFactory<GraphNode, AroEdge<T>> edgeFactory) {
		return new DefaultGraphBuilder<T>(factory,
				new SimpleDirectedWeightedGraph<GraphNode, AroEdge<T>>(
						edgeFactory), edgeFactory);
	}

	
	private GraphModelBuilder<GeoSegment> createSimpleBuilder() {
		return createBuilder(new SimpleWeightedGraph<GraphNode, AroEdge<GeoSegment>>(
				new AroEdgeFactory<GeoSegment>()));
	}

	@Override
	public <T> GraphModelBuilder<T> createDagBuilder() {
		return createDAGBuilder(new AroEdgeFactory<T>());
	}

	public <T> DAGModel<T> createDAG(ClosestFirstSurfaceBuilder<GraphNode, AroEdge<T>> builder, GraphModel<T> graph, GraphNode srcNode,
			Predicate<AroEdge<T>> marked) {
		return new DagBuilder<T>(createDAGBuilder(), graph, builder).createDAG(marked,
				srcNode);
	}

	@Override
	public <T> ClosestFirstSurfaceBuilder<GraphNode, AroEdge<T>> createClosestFirstSurfaceBuilder(NetworkData data,
			NetworkConfiguration configuration) {
		ClosestFirstSurfaceBuilder<GraphNode, AroEdge<T>> builder;
		switch (configuration.getRoutePlanningAlgorithm()) {
		case WEIGHT_MINIMIZATION :
			builder = (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<T>>(g, s);
			break;
		case NPV:
			builder = (g, s) -> new NpvClosestFirstIterator<GraphNode, AroEdge<T>>(configuration.getDiscountRate(), configuration.getPeriods(), g, s);
			break;
		default:
			throw new UnsupportedOperationException("" + configuration.getRoutePlanningAlgorithm() + " algorithm not yet supported.");
		}
		return builder;
	}

	@Override
	public NetworkBuilder createNetworkBuilder(
			GraphModelBuilder<GeoSegment> builder) {
		return new NetworkBuilder(builder, factory);
	}

	@Override
	public GraphNetworkModel createGraphNetworkModel(NetworkData locationData) {

		RoadModelBuilder b = new RoadModelBuilder(createSimpleBuilder(),
				factory, GraphAssignmentFactoryImpl.FACTORY);

		b.setFiberSources(locationData.getFiberSources()) 
				.setRoadLocations(locationData.getRoadLocations())
				.setRoadEdges(locationData.getRoadEdges());
		return b.build();
		
	}

	@Override
	public GraphNetworkModel createGraphNetworkModel(
			Collection<RoadEdge> edges,
			Collection<NetworkAssignment> networkAssignments) {

		GraphNetworkBuilder b = new GraphNetworkBuilder(createSimpleBuilder(),
				factory, GraphAssignmentFactoryImpl.FACTORY);

		b.setNetworkAssignments(networkAssignments).setRoadEdges(edges);
		return b.build();

	}

}
