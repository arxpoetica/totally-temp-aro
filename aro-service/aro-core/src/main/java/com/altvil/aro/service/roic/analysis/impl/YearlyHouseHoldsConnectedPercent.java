package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;

public class YearlyHouseHoldsConnectedPercent extends AbstractStreamFunction {

	private int timeToConnection = 15;
	private double fairShare;
	private double churnRate;

	public YearlyHouseHoldsConnectedPercent(int timeToConnection,
			double fairShare, double churnRate) {
		super();
		this.timeToConnection = timeToConnection;
		this.fairShare = fairShare;
		this.churnRate = churnRate;
	}

	@Override
	public double calc(CalcContext ctx) {
		return (timeToConnection - ctx.getPeriod()) * fairShare * 2
				* (1 + churnRate);
	}

}
