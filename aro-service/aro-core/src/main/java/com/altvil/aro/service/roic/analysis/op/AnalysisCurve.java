package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public class AnalysisCurve extends AbstractStreamFunction {

	// private double startPercent;
	private double endPercent;
	private double rate;

	private double difference;

	public AnalysisCurve(NetworkPenetration networkPenetration) {
		this.endPercent = networkPenetration.getEndPenetration();
		this.rate = networkPenetration.getRate();

		difference = networkPenetration.getStartPenetration() - endPercent ;
	}
	
	@Override
	public double calc(CalcContext ctx) {
		return (difference) * Math.pow(1 + rate, ctx.getPeriod()) + endPercent;
	}



	
}
