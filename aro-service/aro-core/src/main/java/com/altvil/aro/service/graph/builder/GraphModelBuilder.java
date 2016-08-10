package com.altvil.aro.service.graph.builder;

import java.util.Collection;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;

public interface GraphModelBuilder<T> {
	
	public boolean containsEdge(GraphNode left, GraphNode right) ;
	public GraphNodeFactory getVertexFactory() ;
	public GraphNode addVirtualRoot(Collection<GraphNode> targets) ;
	public void addVertex(GraphNode vertex) ;
	public boolean containsVertex(GraphNode vertex) ;
	public AroEdge<T> add(GraphNode src, GraphNode target, T value,  double weight) ;
	public void setRoot(GraphNode root) ;
	public DAGModel<T> buildDAG() ;
	public GraphModel<T> build() ;
	
	
}
