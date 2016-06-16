package com.altvil.aro.service.roic.penetration.impl;

import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public class DefaultNetworkPenetration implements NetworkPenetration {

	private double startPenetration;
	private double endPenetration;
	private double rate;

	public DefaultNetworkPenetration(double startPenetration,
			double endPenetration, double rate) {
		super();
		this.startPenetration = startPenetration;
		this.endPenetration = endPenetration;
		this.rate = rate;
	}
	

	@Override
	public NetworkPenetration modifyRate(double rate) {
		return new DefaultNetworkPenetration(startPenetration, endPenetration,
				rate);
	}

	@Override
	public NetworkPenetration zeroFairShare() {
		return new DefaultNetworkPenetration(startPenetration, 0, rate) ;
	}

	@Override
	public double getRate() {
		return rate;
	}

	@Override
	public double getStartPenetration() {
		return startPenetration;
	}

	@Override
	public double getEndPenetration() {
		return endPenetration;
	}

}
