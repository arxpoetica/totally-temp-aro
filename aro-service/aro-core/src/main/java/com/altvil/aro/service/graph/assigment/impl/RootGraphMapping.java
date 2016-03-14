package com.altvil.aro.service.graph.assigment.impl;

import java.util.Collection;

import com.altvil.aro.service.graph.assigment.GraphMapping;

public class RootGraphMapping extends DefaultGraphMapping implements
		GraphMapping {

	public RootGraphMapping(Collection<GraphMapping> graphMapping) {
		super(null, graphMapping);
	}

}
