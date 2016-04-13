package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;
import com.altvil.aro.service.optimize.model.FiberAssignment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.model.GeneratingNode.Builder;

public class ResolvingNodeBuilder implements GeneratingNode.Builder {

	private Collection<UnresolvedGeneratingNode> unresolvedNodes ;
	//private Resolver resovlver ;
	private Builder nodeBuilder;
	
	private Map<AroEntity, UnresolvedGeneratingNode> nodeMap ;
	
	private interface Resolver {
		AroEntity getParent(AroEntity entity) ;
	}
	
	@Override
	public Builder setJunctionNode(boolean juntionNode) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Builder setFiber(FiberAssignment fiber) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Builder setFiber(FiberType fiberType,
			Collection<AroEdge<GeoSegment>> fiber) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public Builder addChild(EquipmentAssignment equipment) {
		AroEntity parent = equipment.getParentEntity() ;
		GeneratingNode.Builder childBuilder = nodeBuilder.addChild(equipment) ;
		if( parent != null ) {
			UnresolvedGeneratingNode  urn = nodeMap.get(parent) ;
			if( urn != null ) {
				urn.addChild(childBuilder);
			}	
		}
		
		return childBuilder;
	}

	@Override
	public GeneratingNode build() {
		// TODO Auto-generated method stub
		return null;
	}
	
	

}
