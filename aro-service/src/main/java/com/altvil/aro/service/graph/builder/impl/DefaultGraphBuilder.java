package com.altvil.aro.service.graph.builder.impl;

import org.jgrapht.EdgeFactory;
import org.jgrapht.graph.SimpleDirectedWeightedGraph;

import com.altvil.aro.service.dao.graph.impl.GraphModelImpl;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;

public class DefaultGraphBuilder<T> implements  GraphModelBuilder<T> {

	private SimpleDirectedWeightedGraph<GraphNode, AroEdge<T>> graph ;
	private EdgeFactory<GraphNode, AroEdge<T>> edgeFactory ;
	private GraphNode root ;
	
	public DefaultGraphBuilder(EdgeFactory<GraphNode, AroEdge<T>> edgeFactory) {
		this.edgeFactory = edgeFactory ;
		this.graph = new SimpleDirectedWeightedGraph<GraphNode, AroEdge<T>>(edgeFactory) ;
	}
	
	@Override
	public void setRoot(GraphNode root) {
		this.root = root ;
	}
	
	

	@Override
	public AroEdge<T> add(GraphNode src, GraphNode target, T value,
			double weight) {
		graph.addVertex(src) ;
		graph.addVertex(target) ;

		AroEdge<T> edge = edgeFactory.createEdge(src, target);
		graph.addEdge(src, target, edge);
		graph.setEdgeWeight(edge, weight);
		edge.setValue(value) ;
		
		return edge ;
	}

	@Override
	public GraphModel<T> build() {
		return new GraphModelImpl<T>(graph, root) ;
	}
	
	
}
