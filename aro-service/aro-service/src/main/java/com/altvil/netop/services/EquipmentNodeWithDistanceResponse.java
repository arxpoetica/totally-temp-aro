package com.altvil.netop.services;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement
public class EquipmentNodeWithDistanceResponse {
	@XmlElement
	double distance;
	@XmlElement
	long equipmentNodeId;
	
	public double getDistance() {
		return distance;
	}
	public void setDistance(double distance) {
		this.distance = distance;
	}

	public long getEquipmentNodeId() {
		return equipmentNodeId;
	}

	public void setEquipmentNodeId(long equipmentNodeId) {
		this.equipmentNodeId = equipmentNodeId;
	}
	
	

}
