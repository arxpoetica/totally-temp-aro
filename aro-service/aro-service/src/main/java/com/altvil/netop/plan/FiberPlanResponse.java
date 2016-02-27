package com.altvil.netop.plan;

public class FiberPlanResponse {

	private FiberPlanRequest fiberPlanRequest;
	private int newEquipmentCount;

	public FiberPlanRequest getFiberPlanRequest() {
		return fiberPlanRequest;
	}

	public void setFiberPlanRequest(FiberPlanRequest fiberPlanRequest) {
		this.fiberPlanRequest = fiberPlanRequest;
	}

	public int getNewEquipmentCount() {
		return newEquipmentCount;
	}

	public void setNewEquipmentCount(int newEquipmentCount) {
		this.newEquipmentCount = newEquipmentCount;
	}

}
