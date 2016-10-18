package com.altvil.aro.service.graph.alg.routing.impl;

import java.io.IOException;
import java.util.Collection;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.alg.routing.VirtualRoot;

public class CompositeVirtualRoot<V, E> implements VirtualRoot<V, E> {

	private static final Logger log = LoggerFactory
			.getLogger(CompositeVirtualRoot.class.getName());

	private V root;
	private Collection<VirtualRoot<V, E>> roots;

	public CompositeVirtualRoot(V root,
			Collection<VirtualRoot<V, E>> roots) {
		super();
		this.root = root;
		this.roots = roots;
	}

	@Override
	public void close() throws IOException {
		roots.forEach(r -> {
			try {
				r.close();
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
			}
		});

	}

	@Override
	public V getRoot() {
		return root ;
	}
	

}
