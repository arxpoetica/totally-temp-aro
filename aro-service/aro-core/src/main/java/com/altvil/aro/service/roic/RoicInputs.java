package com.altvil.aro.service.roic;

import java.util.Collection;

import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.product.ProductSet;

public class RoicInputs {

	private double houseHoldGrowth;
	private int timePeriodInMonths;
	private Collection<NetworkPenetration> networkPenetrations;
	private Collection<ProductSet> productSets;

	public double getHouseHoldGrowth() {
		return houseHoldGrowth;
	}

	public void setHouseHoldGrowth(double houseHoldGrowth) {
		this.houseHoldGrowth = houseHoldGrowth;
	}

	public int getTimePeriodInMonths() {
		return timePeriodInMonths;
	}

	public void setTimePeriodInMonths(int timePeriodInMonths) {
		this.timePeriodInMonths = timePeriodInMonths;
	}

	public Collection<NetworkPenetration> getNetworkPenetrations() {
		return networkPenetrations;
	}

	public void setNetworkPenetrations(
			Collection<NetworkPenetration> networkPenetrations) {
		this.networkPenetrations = networkPenetrations;
	}

	public Collection<ProductSet> getProductSets() {
		return productSets;
	}

	public void setProductSets(Collection<ProductSet> productSets) {
		this.productSets = productSets;
	}

}
