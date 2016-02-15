package com.altvil.netop.recalc;

import java.util.List;

public class FiberRouteRecalculation {

	private FiberRoutePlaningInputs fiberRoutePlaningInputs;
	private List<FiberRouteUpdate> fiberRouteUpdates;

	public FiberRoutePlaningInputs getFiberRoutePlaningInputs() {
		return fiberRoutePlaningInputs;
	}

	public void setFiberRoutePlaningInputs(
			FiberRoutePlaningInputs fiberRoutePlaningInputs) {
		this.fiberRoutePlaningInputs = fiberRoutePlaningInputs;
	}

	public List<FiberRouteUpdate> getFiberRouteUpdates() {
		return fiberRouteUpdates;
	}

	public void setFiberRouteUpdates(List<FiberRouteUpdate> fiberRouteUpdates) {
		this.fiberRouteUpdates = fiberRouteUpdates;
	}

}
