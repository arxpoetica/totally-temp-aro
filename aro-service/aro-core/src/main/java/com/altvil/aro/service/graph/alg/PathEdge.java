package com.altvil.aro.service.graph.alg;

public class PathEdge<V, E> {
	private V source;
	private V target;
	private E edge;

	public PathEdge(V source, V target, E edge) {
		super();
		this.source = source;
		this.target = target;
		this.edge = edge;
	}

	public V getSource() {
		return source;
	}

	public V getTarget() {
		return target;
	}

	public E getEdge() {
		return edge;
	}
	
	
}