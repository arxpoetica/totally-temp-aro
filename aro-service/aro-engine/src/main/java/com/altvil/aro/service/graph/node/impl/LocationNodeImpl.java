package com.altvil.aro.service.graph.node.impl;

import com.altvil.aro.service.graph.node.GraphNodeVisitor;
import com.altvil.aro.service.graph.node.LocationNode;
import com.vividsolutions.jts.geom.Point;

public class LocationNodeImpl extends AbstractNode implements LocationNode {

	private Long locationId ;
	
	public LocationNodeImpl(Long id, Point point, Long locationId) {
		super(id, point);
		this.locationId = locationId ;
	}

	@Override
	public void accept(GraphNodeVisitor visitor) {
		visitor.visit(this) ;
	}

	@Override
	public Long getLocationId() {
		return locationId ;
	}

	@Override
	public String toString() {
		return this.getClass().getSimpleName() + ":" + getId() + ":" + locationId;
	}

	@Override
	public boolean isLocationNode() {
		return true ;
	}
	
	
	
	
	
}

