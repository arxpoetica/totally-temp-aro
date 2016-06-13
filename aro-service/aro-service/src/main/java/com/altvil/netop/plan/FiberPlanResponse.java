package com.altvil.netop.plan;

import com.altvil.aro.service.planning.FiberPlan;

public class FiberPlanResponse {

	private FiberPlan fiberPlanRequest;
	private int newEquipmentCount;

	public FiberPlan getFiberPlanRequest() {
		return fiberPlanRequest;
	}

	public void setFiberPlanRequest(FiberPlan fiberPlanRequest) {
		this.fiberPlanRequest = fiberPlanRequest;
	}

	public int getNewEquipmentCount() {
		return newEquipmentCount;
	}

	public void setNewEquipmentCount(int newEquipmentCount) {
		this.newEquipmentCount = newEquipmentCount;
	}

}
