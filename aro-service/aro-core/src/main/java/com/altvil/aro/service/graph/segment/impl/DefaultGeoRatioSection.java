package com.altvil.aro.service.graph.segment.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

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
	public CableConstruction getCableConstruction() {
		return cableConstructionCategory;
	}

	@Override
	public Collection<RatioSection> split(int count) {

		if (count < 1) {
			throw new IllegalArgumentException("count must be >= 1");
		}

		List<RatioSection> result = new ArrayList<>();
		if (count == 1) {
			result.add(this);
		} else {

			double sectionRatio = (getEndRationOffset() - getStartRatioOffset()) / count;

			double startRatio = this.getStartRatioOffset();
			for (int i = 0; i < count - 1; i++) {
				double endRatio = startRatio + sectionRatio;
				result.add(new DefaultGeoRatioSection(startRatio, endRatio,
						cableConstructionCategory));
				startRatio = endRatio;
			}
			// Force End Ratio to exactly match
			result.add(new DefaultGeoRatioSection(startRatio, this
					.getEndRationOffset(), cableConstructionCategory));
		}

		return result;
	}

}
