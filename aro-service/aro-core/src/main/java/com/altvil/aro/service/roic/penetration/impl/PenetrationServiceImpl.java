package com.altvil.aro.service.roic.penetration.impl;

import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.penetration.PenetrationHistory;
import com.altvil.aro.service.roic.penetration.PenetrationInput;
import com.altvil.aro.service.roic.penetration.PenetrationService;

public class PenetrationServiceImpl implements PenetrationService {

	@Override
	public NetworkPenetration createNetworkTypePenetration(
			PenetrationInput input) {
		return new DefaultNetworkPenetration(input.getStartShare(),
				input.getEndShare(), input.getRate());
	}

	@Override
	public NetworkPenetration calculateRate(PenetrationHistory history,
			double targetFairShare) {
		return new DefaultNetworkPenetration(history.getEndPenetration(),
				targetFairShare, calcRate(history, targetFairShare));
	}

	private double calcRate(PenetrationHistory history, double targetFairShare) {
		return ((history.getEndPenetration() - targetFairShare) / Math.pow(
				(history.getInitialPenetration() - targetFairShare),
				1 / history.getTime())) - 1;
	}

	@SuppressWarnings("unused")
	private double calcPeriods(double rate, double ratio) {
		return Math.log(ratio) / Math.log(1 + rate);
	}

	@SuppressWarnings("unused")
	private double calcRateFromPeriod(double t) {
		return Math.pow(0.5, 1 / t) - 1;
	}

	@SuppressWarnings("unused")
	private double calcCurve(double start, double end, double rate, double t) {
		return (start - end) * Math.pow(1 + rate, t) + end;
	}

}
