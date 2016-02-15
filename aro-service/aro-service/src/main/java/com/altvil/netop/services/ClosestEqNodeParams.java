package com.altvil.netop.services;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class ClosestEqNodeParams {
	@XmlElement
	int serviceAreaId;
	@XmlElement
	int deploymentPlanId;
	@XmlElement
	double latitude;
	@XmlElement
	double longitude;
	@XmlElement
	boolean useDirectionalGraph;
	@XmlElement
	String deploymentDate;
	
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
	public double getLatitude() {
		return latitude;
	}
	public void setLatitude(double latitude) {
		this.latitude = latitude;
	}
	public double getLongitude() {
		return longitude;
	}
	public void setLongitude(double longitude) {
		this.longitude = longitude;
	}
	public boolean isUseDirectionalGraph() {
		return useDirectionalGraph;
	}
	public void setUseDirectionalGraph(boolean useDirectionalGraph) {
		this.useDirectionalGraph = useDirectionalGraph;
	}
	public String getDeploymentDate() {
		return deploymentDate;
	}
	public void setDeploymentDate(String deploymentDate) {
		this.deploymentDate = deploymentDate;
	}
	
}
