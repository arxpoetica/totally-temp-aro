package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.PeriodFunction;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public class AnalysisCurve implements PeriodFunction {

	// private double startPercent;
	private double endPercent;
	private double rate;

	private double difference;

	public AnalysisCurve(NetworkPenetration networkPenetration) {
		this.endPercent = networkPenetration.getEndPenetration();
		this.rate = networkPenetration.getRate();
		;

		difference = networkPenetration.getStartPenetration() - endPercent;
	}

	@Override
	public double apply(int t) {
		return (difference) * Math.pow(1 + rate, t) + endPercent;
	}
}
