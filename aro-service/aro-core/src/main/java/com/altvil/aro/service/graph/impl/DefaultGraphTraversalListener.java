package com.altvil.aro.service.graph.impl;

import org.jgrapht.event.ConnectedComponentTraversalEvent;
import org.jgrapht.event.EdgeTraversalEvent;
import org.jgrapht.event.TraversalListener;
import org.jgrapht.event.VertexTraversalEvent;

public class DefaultGraphTraversalListener<G, T> implements TraversalListener<G, T> {

	@Override
	public void edgeTraversed(EdgeTraversalEvent<G, T> e) {
		//System.out.println("edgeTraversed " + e.getEdge()) ;
	}

	@Override
	public void vertexTraversed(VertexTraversalEvent<G> e) {
	}

	@Override
	public void vertexFinished(VertexTraversalEvent<G> e) {
	}

	@Override
	public void connectedComponentFinished(ConnectedComponentTraversalEvent e) {
	}

	@Override
	public void connectedComponentStarted(ConnectedComponentTraversalEvent e) {
	}

	
}
