package com.altvil.aro.service.graph.alg;

public interface GraphPathListener<V, E> {
	public boolean onPathFound(DAGPath<V, E> path);
}