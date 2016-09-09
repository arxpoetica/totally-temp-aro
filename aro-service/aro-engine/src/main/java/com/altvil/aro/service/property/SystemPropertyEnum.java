package com.altvil.aro.service.property;

public enum SystemPropertyEnum implements SymbolRef {

	max_feeder_fiber_length_meters, max_distribution_fiber_length_meters;

	@Override
	public String getName() {
		return name();
	}

}