package com.altvil.aro.service.graph.builder.impl;

import org.jgrapht.EdgeFactory;
import org.jgrapht.graph.SimpleDirectedWeightedGraph;

import com.altvil.aro.service.dao.graph.impl.GraphModelImpl;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.node.GraphNode;

public class DefaultGraphBuilder<E extends AroEdge> implements  GraphModelBuilder<E> {

	private SimpleDirectedWeightedGraph<GraphNode, E> graph ;
	private EdgeFactory<GraphNode, E> edgeFactory ;
	private GraphNode root ;
	
	public DefaultGraphBuilder(EdgeFactory<GraphNode, E> edgeFactory) {
		this.edgeFactory = edgeFactory ;
		this.graph = new SimpleDirectedWeightedGraph<GraphNode, E>(edgeFactory) ;
	}
	
	@Override
	public void setRoot(GraphNode root) {
		this.root = root ;
	}

	@Override
	public E add(GraphNode src, GraphNode target, double weight) {
		graph.addVertex(src) ;
		graph.addVertex(target) ;

		E edge = edgeFactory.createEdge(src, target);
		graph.addEdge(src, target, edge);
		graph.setEdgeWeight(edge, weight);
		
		return edge ;
		
	}
	
	public GraphModel<E> build() {
		return new GraphModelImpl<E>(graph, root) ;
	}

}
