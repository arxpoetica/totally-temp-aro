package com.altvil.aro.service.roic.penetration;

import com.altvil.aro.service.roic.model.NetworkType;

public class PenetrationHistory {
	
	private NetworkType networkType ;
	private double time ;
	private double initialPenetration ;
	private double endPenetration ;
	
	
	public PenetrationHistory(NetworkType networkType, double time,
			double initialPenetration, double endPenetration) {
		super();
		this.networkType = networkType;
		this.time = time;
		this.initialPenetration = initialPenetration;
		this.endPenetration = endPenetration;
	}
	public NetworkType getNetworkType() {
		return networkType;
	}
	public void setNetworkType(NetworkType networkType) {
		this.networkType = networkType;
	}
	public double getTime() {
		return time;
	}
	public void setTime(double time) {
		this.time = time;
	}
	public double getInitialPenetration() {
		return initialPenetration;
	}
	public void setInitialPenetration(double initialPenetration) {
		this.initialPenetration = initialPenetration;
	}
	public double getEndPenetration() {
		return endPenetration;
	}
	public void setEndPenetration(double endPenetration) {
		this.endPenetration = endPenetration;
	}
	
	

}
