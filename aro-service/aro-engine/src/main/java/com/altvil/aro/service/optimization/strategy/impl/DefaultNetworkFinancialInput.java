package com.altvil.aro.service.optimization.strategy.impl;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.roic.NetworkFinancialInput;

public class DefaultNetworkFinancialInput implements NetworkFinancialInput {

	private boolean isValid ;
	private double fixedCosts ;
	private LocationDemand locationDemand ;
	
	public DefaultNetworkFinancialInput(boolean isValid, double fixedCosts,
			LocationDemand locationDemand) {
		super();
		this.isValid = isValid;
		this.fixedCosts = fixedCosts;
		this.locationDemand = locationDemand;
	}

	@Override
	public boolean isValid() {
		return isValid ;
	}

	@Override
	public double getFixedCosts() {
		return fixedCosts ;
	}

	@Override
	public LocationDemand getLocationDemand() {
		return locationDemand ;
	}

}
