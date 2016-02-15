package com.altvil.aro.service.dao.graph.impl;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

import org.jgrapht.DirectedGraph;
import org.jgrapht.event.TraversalListener;
import org.jgrapht.traverse.GraphIterator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.node.GraphNode;

public class GraphModelImpl<T> implements GraphModel<T> {

	
	private static final Logger log = LoggerFactory
			.getLogger(GraphModelImpl.class.getName());

	
	private DirectedGraph<GraphNode, AroEdge<T>> graph;
	private GraphNode root;

	public GraphModelImpl(DirectedGraph<GraphNode, AroEdge<T>> graph,
			GraphNode root) {
		super();
		this.graph = graph;
		this.root = root;
	}

	@Override
	public DirectedGraph<GraphNode, AroEdge<T>> getGraph() {
		return graph;
	}

	@Override
	public GraphNode getRoot() {
		return root;
	}

	@Override
	public GraphIterator<GraphNode, AroEdge<T>> depthFirstItr() {
		//return new DepthFirstIterator<GraphNode, E>(graph, root);
		return new SimpleIterator<T>(new Dft().toItr(root)) ;
	}
	
	
	
	private static class SimpleIterator<T> implements GraphIterator<GraphNode, AroEdge<T>> {

		private Iterator<GraphNode> itr ;
		
		public SimpleIterator(Iterator<GraphNode> itr) {
			super();
			this.itr = itr;
		}


		@Override
		public boolean hasNext() {
			return itr.hasNext() ;
		}
		

		@Override
		public GraphNode next() {
			return itr.next() ;
		}

		@Override
		public void forEachRemaining(Consumer<? super GraphNode> action) {
		}

		@Override
		public boolean isCrossComponentTraversal() {
			// TODO Auto-generated method stub
			return false;
		}

		@Override
		public void setReuseEvents(boolean reuseEvents) {
		}

		@Override
		public boolean isReuseEvents() {
			return false;
		}

		@Override
		public void addTraversalListener(TraversalListener<GraphNode, AroEdge<T>> l) {
		}

		@Override
		public void remove() {
		}

		@Override
		public void removeTraversalListener(TraversalListener<GraphNode, AroEdge<T>> l) {
		}
		
		
		
	}
	
	private class Dft {
	
		private Set<GraphNode> visited = new HashSet<>() ;
		private List<GraphNode> list = new ArrayList<>() ;
		
		public Iterator<GraphNode> toItr(GraphNode root) {
			tarverse(root) ;
			return list.iterator() ;
		}
		
		private void tarverse(GraphNode node) {
			if( !visited.contains(node) ) {
				visited.add(node) ;
				
				if( log.isTraceEnabled() ) {
					System.out.println("outgoing = " + graph.outgoingEdgesOf(node) + " incomming = " + graph.incomingEdgesOf(node)) ;
				}
			
				for(AroEdge<T> ae : graph.incomingEdgesOf(node)) {
					tarverse(ae.getSourceNode()) ;
				}
				
				list.add(node) ;
			}
		}
		
	}
	
	
	

}
