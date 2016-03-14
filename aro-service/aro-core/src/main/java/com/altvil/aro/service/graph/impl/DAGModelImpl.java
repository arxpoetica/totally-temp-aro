package com.altvil.aro.service.graph.impl;

import java.util.ArrayList;
import java.util.Collection;

import org.jgrapht.DirectedGraph;
import org.jgrapht.EdgeFactory;
import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.node.GraphNode;

public class DAGModelImpl<T> extends GraphModelImpl<T> implements DAGModel<T> {

	// private static final Logger log = LoggerFactory
	// .getLogger(DAGModelImpl.class.getName());
	//
	private DirectedGraph<GraphNode, AroEdge<T>> dag ;
	
	public DAGModelImpl(DirectedGraph<GraphNode, AroEdge<T>> dag, WeightedGraph<GraphNode, AroEdge<T>> graph,
			EdgeFactory<GraphNode, AroEdge<T>> edgeFactory,
			GraphNode root) {
		super(graph, edgeFactory, root);
		this.dag = dag ;
	}
	

	@Override
	public DAGModel<T> removeRootNode(GraphNode rootNode) {
		if( dag.containsVertex(rootNode) ) {
			Collection<AroEdge<T>> edges = new ArrayList<>(dag.incomingEdgesOf(rootNode)) ;
			edges.forEach(e -> {
				dag.removeEdge(e.getSourceNode(), e.getTargetNode()) ;
			});
		}
		return this ;
	}





	@Override
	public DirectedGraph<GraphNode, AroEdge<T>> getAsDirectedGraph() {
		return dag ;
	}
	

	
}
