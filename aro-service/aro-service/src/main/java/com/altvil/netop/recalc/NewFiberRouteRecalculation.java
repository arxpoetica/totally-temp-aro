package com.altvil.netop.recalc;

import java.util.List;

public class NewFiberRouteRecalculation {

	private NewFiberRoutePlaningInputs newFiberRoutePlaningInputs;
	private List<RawRoute> fiberRouteJson;

	public NewFiberRoutePlaningInputs getNewFiberRoutePlaningInputs() {
		return newFiberRoutePlaningInputs;
	}

	public void setNewFiberRoutePlaningInputs(
			NewFiberRoutePlaningInputs newFiberRoutePlaningInputs) {
		this.newFiberRoutePlaningInputs = newFiberRoutePlaningInputs;
	}

	
	public List<RawRoute> getFiberRouteUpdates() {
		return fiberRouteJson;
	}

	public void setFiberRouteUpdates(List<RawRoute> fiberRouteUpdates) {
		this.fiberRouteJson = fiberRouteUpdates;
	}

}
