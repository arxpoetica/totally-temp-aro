package com.altvil.aro.service.graph.node.impl;

import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.google.inject.Singleton;
import com.vividsolutions.jts.geom.Point;
import org.springframework.stereotype.Service;

@Service
@Singleton
public class GraphNodeFactoryImpl implements GraphNodeFactory {

	//private AtomicLong idGen = new AtomicLong(0);
	
	@Override
	public GraphNode createGraphNode(Point point) {
		return new DefaultVertex(point);
	}

}
