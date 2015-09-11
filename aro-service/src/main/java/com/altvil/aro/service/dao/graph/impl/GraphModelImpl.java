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

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.node.GraphNode;

public class GraphModelImpl<E extends AroEdge> implements GraphModel<E> {

	private DirectedGraph<GraphNode, E> graph;
	private GraphNode root;

	public GraphModelImpl(DirectedGraph<GraphNode, E> graph,
			GraphNode root) {
		super();
		this.graph = graph;
		this.root = root;
	}

	@Override
	public DirectedGraph<GraphNode, E> getGraph() {
		return graph;
	}

	@Override
	public GraphNode getRoot() {
		return root;
	}

	@Override
	public GraphIterator<GraphNode, E> depthFirstItr() {
		//return new DepthFirstIterator<GraphNode, E>(graph, root);
		return new SimpleIterator<E>(new Dft().toItr(root)) ;
	}
	
	
	
	private static class SimpleIterator<E> implements GraphIterator<GraphNode, E> {

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
		public void addTraversalListener(TraversalListener<GraphNode, E> l) {
		}

		@Override
		public void remove() {
		}

		@Override
		public void removeTraversalListener(TraversalListener<GraphNode, E> l) {
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
				
				System.out.println("outgoing = " + graph.outgoingEdgesOf(node) + " incomming = " + graph.incomingEdgesOf(node)) ;
			
				for(AroEdge ae : graph.incomingEdgesOf(node)) {
					tarverse(ae.getSourceNode()) ;
				}
				
				list.add(node) ;
			}
		}
		
	}
	
	
	

}
