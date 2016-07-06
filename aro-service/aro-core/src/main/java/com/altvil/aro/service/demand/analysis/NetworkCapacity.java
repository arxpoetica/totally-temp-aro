package com.altvil.aro.service.demand.analysis;

public class NetworkCapacity {

	private SpeedCategory speedCategory;
	private double providerStrength;

	public SpeedCategory getSpeedCategory() {
		return speedCategory;
	}

	public void setSpeedCategory(SpeedCategory speedCategory) {
		this.speedCategory = speedCategory;
	}

	public double getProviderStrength() {
		return providerStrength;
	}

	public void setProviderStrength(double providerStrength) {
		this.providerStrength = providerStrength;
	}

}
