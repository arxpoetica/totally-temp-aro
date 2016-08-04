package com.altvil.aro.service.network.impl;

import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;

public class CableConduitEdgeImpl implements CableConduitEdge {

	private long edgeId ;
	private CableConstructionEnum cableConstructionEnum ;
	private double startRatio ;
	private double endRatio ;
	
	
	public CableConduitEdgeImpl(long edgeId,
			CableConstructionEnum cableConstructionEnum, double startRatio,
			double endRatio) {
		super();
		this.edgeId = edgeId;
		this.cableConstructionEnum = cableConstructionEnum;
		this.startRatio = startRatio;
		this.endRatio = endRatio;
	}

	@Override
	public Long getEdgeId() {
		return edgeId ;
	}

	@Override
	public CableConstructionEnum getCableConstructionEnum() {
		return cableConstructionEnum;
	}

	@Override
	public double getStartRatio() {
		return startRatio ;
	}

	@Override
	public double getEndRatio() {
		return endRatio ;
	}

}
