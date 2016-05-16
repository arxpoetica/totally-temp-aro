package com.altvil.netop.plan;

import com.altvil.aro.service.planning.fiber.AbstractFiberPlan;

public class FiberPlanResponse {

	private AbstractFiberPlan fiberPlanRequest;
	private int newEquipmentCount;

	public AbstractFiberPlan getFiberPlanRequest() {
		return fiberPlanRequest;
	}

	public void setFiberPlanRequest(AbstractFiberPlan fiberPlanRequest) {
		this.fiberPlanRequest = fiberPlanRequest;
	}

	public int getNewEquipmentCount() {
		return newEquipmentCount;
	}

	public void setNewEquipmentCount(int newEquipmentCount) {
		this.newEquipmentCount = newEquipmentCount;
	}

}
