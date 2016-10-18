package com.altvil.aro.service.graph.alg.routing;

import java.io.Closeable;

public interface VirtualRoot<V, E> extends Closeable {

	public V getRoot();

}