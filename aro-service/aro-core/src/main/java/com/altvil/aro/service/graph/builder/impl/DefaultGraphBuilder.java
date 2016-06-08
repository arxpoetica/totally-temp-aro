package com.altvil.aro.service.graph.builder.impl;

import java.util.Collection;

import org.jgrapht.DirectedGraph;
import org.jgrapht.EdgeFactory;
import org.jgrapht.WeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.impl.DAGModelImpl;
import com.altvil.aro.service.graph.impl.GraphModelImpl;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;

public class DefaultGraphBuilder<T> implements GraphModelBuilder<T> {
	
	private static final Logger log = LoggerFactory
			.getLogger(DefaultGraphBuilder.class.getName());
	
	
	private GraphNodeFactory vertexFactory ;
	private WeightedGraph<GraphNode, AroEdge<T>> graph;
	private EdgeFactory<GraphNode, AroEdge<T>> edgeFactory;
	private GraphNode root;

	public DefaultGraphBuilder(
			GraphNodeFactory vertexFactory,
			WeightedGraph<GraphNode, AroEdge<T>> graph,
			EdgeFactory<GraphNode, AroEdge<T>> edgeFactory) {
		this.vertexFactory = vertexFactory ;
		this.edgeFactory = edgeFactory;
		this.graph = graph;
	}

	@Override
	public void setRoot(GraphNode root) {
		this.root = root;
	}
	
	@Override
	public GraphNodeFactory getVertexFactory() {
		return vertexFactory ;
	}

	@Override
	public GraphNode addVirtualRoot(Collection<GraphNode> sources) {
		
		GraphNode rootNode = vertexFactory.createGraphNode(null) ;
		
		sources.forEach(s -> {
			add(s, rootNode, null, 0.0) ;
		});
		
		return rootNode;
	}
	
	

	@Override
	public void addVertex(GraphNode vertex) {
		graph.addVertex(vertex) ;
	}

	@Override
	public AroEdge<T> add(GraphNode src, GraphNode target, T value,
			double weight) {
		
		//System.out.println(src + "->" +target) ;
		
		graph.addVertex(src);
		graph.addVertex(target);
		
		AroEdge<T> edge = edgeFactory.createEdge(src, target);
		if( !graph.addEdge(src, target, edge) ) {
			if( log.isInfoEnabled() ) log.trace("Failed to add Edge {}->{}", src, target) ;
			return null ;
		};
		graph.setEdgeWeight(edge, weight);
		edge.setValue(value);

		return edge;
	}

	@SuppressWarnings("unchecked")
	@Override
	public DAGModel<T> buildDAG() {
		return new DAGModelImpl<T>(
				(DirectedGraph<GraphNode, AroEdge<T>>) graph, graph,
				edgeFactory, root);
	}

	@Override
	public GraphModel<T> build() {
		return new GraphModelImpl<T>(graph, edgeFactory, root);
	}

}
