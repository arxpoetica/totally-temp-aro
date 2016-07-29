package com.altvil.aro.service.graph.segment.impl;

import com.altvil.aro.service.graph.segment.CableConstruction;
import com.altvil.aro.service.graph.segment.RatioSection;

public class DefaultGeoRatioSection implements RatioSection {

	private double startRatio;
	private double endRatio;
	private CableConstruction cableConstructionCategory;

	public DefaultGeoRatioSection(double startRatio, double endRatio,
			CableConstruction cableConstructionCategory) {
		super();
		this.startRatio = startRatio;
		this.endRatio = endRatio;
		this.cableConstructionCategory = cableConstructionCategory;
	}

	@Override
	public double getStartRatioOffset() {
		return startRatio;
	}

	@Override
	public double getEndRationOffset() {
		return endRatio;
	}

	@Override
	public CableConstruction getCableConstructionCategory() {
		return cableConstructionCategory;
	}

}
