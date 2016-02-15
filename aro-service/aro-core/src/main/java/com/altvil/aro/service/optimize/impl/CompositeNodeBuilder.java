package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.FiberType;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class CompositeNodeBuilder implements Builder {

	private Builder nodeBuilder;
	private FiberType fiberType ;
	private List<Builder> children = new ArrayList<>();
	
	public CompositeNodeBuilder(Builder nodeBuilder) {
		super();
		this.nodeBuilder = nodeBuilder;
	}

	@Override
	public Builder setFiber(FiberAssignment fiber) {
		nodeBuilder.setFiber(fiber);
		this.fiberType = fiber.getFiberType() ;
		return this;
	}

	@Override
	public Builder setFiber(FiberType fiberType, Collection<AroEdge<GeoSegment>> fiber) {
		nodeBuilder.setFiber(fiberType, fiber);
		this.fiberType = fiberType ;
		return this;
	}

	@Override
	public Builder addChild(EquipmentAssignment equipment) {
		Builder builder = nodeBuilder.addChild(equipment);
		builder.setFiber(fiberType, new ArrayList<AroEdge<GeoSegment>>()) ;
		children.add(builder);
		return builder;
	}

	@Override
	public GeneratingNode build() {
		children.forEach(Builder::build);
		return nodeBuilder.build();
	}

	@Override
	public Builder setJunctionNode(boolean juntionNode) {
		nodeBuilder.setJunctionNode(juntionNode);
		return this;
	}
	
	
	
	

}
