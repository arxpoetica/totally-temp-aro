package com.altvil.aro.service.graph.transform.impl;

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
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.builder.impl.DefaultGraphBuilder;
import com.altvil.aro.service.graph.impl.AroEdgeFactory;
import com.altvil.aro.service.graph.impl.DagBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.GraphTransformerFactory;
import com.altvil.aro.service.graph.transform.ftp.FiberDagScanner;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.graph.transform.network.GraphRenoder;
import com.altvil.aro.service.graph.transform.network.NetworkBuilder;
import com.google.inject.Inject;
import com.google.inject.Singleton;

@Service
@Singleton
public class GraphTransformerFactoryImpl implements GraphTransformerFactory {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(GraphTransformerFactoryImpl.class.getName());
	
	private EntityDemandService entityDemandService ;
	private GraphNodeFactory factory;
	
	@Autowired
	@Inject
	public GraphTransformerFactoryImpl(GraphNodeFactory factory, EntityDemandService entityDemandService) {
		this.factory = factory;
		this.entityDemandService = entityDemandService ;
	}
	
	@Override
	public <T> GraphModelBuilder<T> createBuilder(
			WeightedGraph<GraphNode, AroEdge<T>> graph) {
		return new DefaultGraphBuilder<T>(factory, graph, new AroEdgeFactory<T>());
	}

	@Override
	public <T> DAGModel<T> createDAG(GraphModel<T> graph, GraphNode srcNode,
			Predicate<AroEdge<T>> predicate) {
		return new DagBuilder<T>(createDAGBuilder(), graph).createDAG(predicate,
				srcNode);
	}

	@Override
	public <T> GraphModelBuilder<T> createDagBuilder() {
		return createDAGBuilder(new AroEdgeFactory<T>());
	}

	@Override
	public <T> GraphModelBuilder<T> createDAGBuilder() {
		return createDAGBuilder(new AroEdgeFactory<T>());
	}
	
	
	private <T> GraphModelBuilder<T> createDAGBuilder(
			EdgeFactory<GraphNode, AroEdge<T>> edgeFactory) {
		return new DefaultGraphBuilder<T>(factory,
				new SimpleDirectedWeightedGraph<GraphNode, AroEdge<T>>(
						edgeFactory), edgeFactory);
	}

	@Override
	public GraphModelBuilder<GeoSegment> createGraphBuilder() {
		AroEdgeFactory<GeoSegment> f = new AroEdgeFactory<GeoSegment>() ;
		return new DefaultGraphBuilder<GeoSegment>(factory,
				new SimpleWeightedGraph<GraphNode, AroEdge<GeoSegment>>(f), f);
	}
	

	@Override
	public GraphRenoder createNetworkBuilder(
			GraphModelBuilder<GeoSegment> builder) {
		return new NetworkBuilder(builder, factory);
	}

	
	@Override
	public FiberDagScanner createWirecenterTransformer(FtthThreshholds threshholds) {
		return new FiberDagScanner(entityDemandService.createDemandAnalyizer(threshholds), threshholds);
	}

	@Override
	public <T> GraphModelBuilder<T> modifyModel(GraphModel<T> model) {
		AroEdgeFactory<T> f = new AroEdgeFactory<T>() ;
		return new DefaultGraphBuilder<T>(factory,
				model.getGraph(), f);
	}
	
	

}
