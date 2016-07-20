package com.altvil.aro.service.roic;

import com.altvil.aro.service.entity.LocationDemand;

public interface NetworkFinancialInput {

	boolean isValid();

	double getFixedCosts();

	LocationDemand getLocationDemand();

}
