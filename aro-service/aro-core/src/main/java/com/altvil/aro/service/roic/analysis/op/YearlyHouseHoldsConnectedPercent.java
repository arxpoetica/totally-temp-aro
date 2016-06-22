package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;

public class YearlyHouseHoldsConnectedPercent extends AbstractStreamFunction {

	private int timeToConnection = 15;
	private double fairShare;
	private double churnRate;
	private double entityConunt;

	// ( (time to full connection) - (time t) ) * (fair share) * (1 + churn) *
	// (starting HHs) / 75

	public YearlyHouseHoldsConnectedPercent(int timeToConnection,
			double fairShare, double churnRate, double entityCount) {
		super();
		this.timeToConnection = timeToConnection;
		this.fairShare = fairShare;
		this.churnRate = churnRate;
		this.entityConunt = entityCount;
	}

	@Override
	public double calc(CalcContext ctx) {
		return (timeToConnection - ctx.getPeriod()) * fairShare
				* (1 + churnRate) * (entityConunt / 75);

	}

}
