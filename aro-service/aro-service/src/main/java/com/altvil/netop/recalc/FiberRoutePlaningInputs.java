package com.altvil.netop.recalc;

import java.util.Date;
import java.util.List;

public class FiberRoutePlaningInputs {

	private int serviceAreaId;
	private int deploymentPlanId;
	private List<FiberPlanRequest> fiberPlanRequests;
	private Date deploymentDate;

	public int getServiceAreaId() {
		return serviceAreaId;
	}

	public void setServiceAreaId(int serviceAreaId) {
		this.serviceAreaId = serviceAreaId;
	}

	public int getDeploymentPlanId() {
		return deploymentPlanId;
	}

	public void setDeploymentPlanId(int deploymentPlanId) {
		this.deploymentPlanId = deploymentPlanId;
	}

	public List<FiberPlanRequest> getFiberPlanRequests() {
		return fiberPlanRequests;
	}

	public void setFiberPlanRequests(List<FiberPlanRequest> fiberPlanRequests) {
		this.fiberPlanRequests = fiberPlanRequests;
	}

	public Date getDeploymentDate() {
		return deploymentDate;
	}

	public void setDeploymentDate(Date deploymentDate) {
		this.deploymentDate = deploymentDate;
	}

}
