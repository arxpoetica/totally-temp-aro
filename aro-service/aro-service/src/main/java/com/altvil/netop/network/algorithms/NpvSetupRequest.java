package com.altvil.netop.network.algorithms;

import java.util.HashMap;
import java.util.Map;

import com.altvil.netop.network.AbstractNetworkStrategyRequest;

public class NpvSetupRequest extends AbstractNetworkStrategyRequest {
	private final Map<String, Object> properties = new HashMap<>(2);
	
	public double getDiscountRate() {
		return ((Double) properties.get("discountRate"));
	}
	public void setDiscountRate(double discountRate) {
		properties.put("discountRate", discountRate);
	}
	public int getYears() {
		return ((Integer) properties.get("years"));
	}
	public void setYears(int years) {
		properties.put("years", years);
	}
	
	@Override
	public String getAlgorithm() {
		return "NPV";
	}
	
	@Override
	public Map<String, Object> getProperties() {
		return properties;
	}
}
