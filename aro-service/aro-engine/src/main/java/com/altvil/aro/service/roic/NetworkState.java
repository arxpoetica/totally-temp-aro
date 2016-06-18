package com.altvil.aro.service.roic;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public class NetworkState {

	private LocationEntityType type;

	private double entityCount;
	private double premisesPassed;
	private double arpu;
	private NetworkPenetration networkPenetration;

	public LocationEntityType getType() {
		return type;
	}

	public void setType(LocationEntityType type) {
		this.type = type;
	}

	public double getEntityCount() {
		return entityCount;
	}

	public void setEntityCount(double entityCount) {
		this.entityCount = entityCount;
	}

	public double getPremisesPassed() {
		return premisesPassed;
	}

	public void setPremisesPassed(double premisesPassed) {
		this.premisesPassed = premisesPassed;
	}

	public double getArpu() {
		return arpu;
	}

	public void setArpu(double arpu) {
		this.arpu = arpu;
	}

	public NetworkPenetration getNetworkPenetration() {
		return networkPenetration;
	}

	public void setNetworkPenetration(NetworkPenetration networkPenetration) {
		this.networkPenetration = networkPenetration;
	}

}
