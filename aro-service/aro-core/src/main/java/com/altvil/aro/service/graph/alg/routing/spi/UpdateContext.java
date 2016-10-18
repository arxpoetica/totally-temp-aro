package com.altvil.aro.service.graph.alg.routing.spi;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;

public interface UpdateContext<V, E> {

	public ClosestFirstSurfaceIterator<V, E> getIterator(V vertex) ; 
	
}
