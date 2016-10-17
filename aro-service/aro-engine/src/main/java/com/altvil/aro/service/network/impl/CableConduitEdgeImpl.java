package com.altvil.aro.service.network.impl;

import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;

import java.io.Serializable;

@SuppressWarnings("serial")
public class CableConduitEdgeImpl implements CableConduitEdge, Serializable {

	
	public static final CableConduitEdge INVALID_EDGE = new CableConduitEdgeImpl(-1, CableConstructionEnum.UNKNOWN, 0, -1) ;
	
	private long edgeId;
	private CableConstructionEnum cableConstructionEnum;
	private double startRatio;
	private double endRatio;

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
		return edgeId;
	}

	@Override
	public boolean isValid() {
		return endRatio > startRatio;
	}

	@Override
	public CableConduitEdge expandHigher(double ratio) {
		return new CableConduitEdgeImpl(edgeId, cableConstructionEnum,
				startRatio, Math.min(1.0, Math.max(ratio, endRatio)));
	}

	@Override
	public CableConduitEdge expandLower(double ratio) {
		return new CableConduitEdgeImpl(edgeId, cableConstructionEnum,
				Math.max(0.0, Math.min(ratio, startRatio)), endRatio);
	};

	@Override
	public CableConduitEdge splitLower(double ratio) {
		if( ratio <= this.getStartRatio()) {
			return INVALID_EDGE ;
		}
		return new CableConduitEdgeImpl(edgeId, cableConstructionEnum, getStartRatio(), ratio);
	}

	@Override
	public CableConduitEdge splitHigher(double ratio) {
		if( ratio >= getEndRatio() ) {
			return INVALID_EDGE ;
		}
		
		return new CableConduitEdgeImpl(edgeId, cableConstructionEnum, startRatio, endRatio);
	}

	@Override
	public CableConstructionEnum getCableConstructionEnum() {
		return cableConstructionEnum;
	}

	@Override
	public double getStartRatio() {
		return startRatio;
	}

	@Override
	public double getEndRatio() {
		return endRatio;
	}

}
