package com.altvil.netop.recalc;

import java.util.Date;
import java.util.List;

public class NewFiberRoutePlaningInputs {


	private int serviceAreaId;
	private int deploymentPlanId;
	private Date deploymentDate;
	private FiberPlanRequest sourceFiberRequest;
	private List<Long> targetOids ;
	
	public FiberPlanRequest getSourceFiberRequest() {
		return sourceFiberRequest;
	}

	public void setSourceFiberRequest(FiberPlanRequest sourceFiberRequest) {
		this.sourceFiberRequest = sourceFiberRequest;
	}

	public List<Long> getTargetOids() {
		return targetOids;
	}

	public void setTargetOids(List<Long> targetOids) {
		this.targetOids = targetOids;
	}

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

	public Date getDeploymentDate() {
		return deploymentDate;
	}

	public void setDeploymentDate(Date deploymentDate) {
		this.deploymentDate = deploymentDate;
	}
	
}
