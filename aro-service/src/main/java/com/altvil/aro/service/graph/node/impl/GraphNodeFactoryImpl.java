package com.altvil.aro.service.graph.node.impl;

import com.altvil.aro.service.graph.node.FDHNode;
import com.altvil.aro.service.graph.node.FDTNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.node.LocationNode;
import com.altvil.aro.service.graph.node.RoadNode;
import com.altvil.aro.service.graph.node.SpliceNode;
import com.google.inject.Singleton;
import com.vividsolutions.jts.geom.Point;

@Singleton
public class GraphNodeFactoryImpl implements GraphNodeFactory {

	@Override
	public SpliceNode createSpliceNode(Long id, Point point) {
		return new SpliceNodeImpl(id, point);
	}
	

	@Override
	public RoadNode createRoadNode(Long id, Point point) {
		return new RoadNodeImpl(id, point);
	}

	@Override
	public LocationNode createLocationNode(Long id, Point point, long locationId) {
		return new LocationNodeImpl(id, point, locationId);
	}

	@Override
	public FDTNode createFDTNode(Long id, Point point) {
		return new FDTNodeImpl(id, point);
	}


	@Override
	public FDHNode createFDHNode(Long id, Point point) {
		return new FDHNodeImpl(id, point) ;
	}
	
	
	

}
