package com.altvil.aro.service.roic.analysis.impl;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentBuilder;
import com.altvil.aro.service.roic.analysis.builder.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.builder.RoicModelBuilder;
import com.altvil.aro.service.roic.analysis.builder.impl.ComponentBuilderImpl;
import com.altvil.aro.service.roic.analysis.builder.impl.NetworkAnalysisBuilderImpl;
import com.altvil.aro.service.roic.analysis.builder.impl.RoicAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.impl.MonthlyHouseHoldsConnectedPercent.Params;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

@Service
public class AnalysisServiceImpl implements AnalysisService {

	@Override
	public StreamFunction createCurve(NetworkPenetration networkPenetration) {
		return new AnalysisCurve(networkPenetration);
	}

	@Override
	public StreamFunction createCashFlow(CurveIdentifier revenueId,
			CurveIdentifier capexId, CurveIdentifier connectCapexId,
			CurveIdentifier networkCapexId) {
		return new CashFlow(revenueId, capexId, connectCapexId, networkCapexId);
	}

	@Override
	public StreamFunction createCurve(AnalysisRow row) {
		return new AbstractStreamFunction() {
			@Override
			public double calc(CalcContext ctx) {
				return row.getValue(ctx.getPeriod());
			}
		};
	}

	@Override
	public StreamFunction createTruncatedConstantStream(double constValue,
			int endPeriod) {
		return new TruncatedConstantStream(constValue, endPeriod);
	}

	@Override
	public ComponentBuilder createComponentBuilder(NetworkType type) {
		return new ComponentBuilderImpl(this, type);
	}

	@Override
	public NetworkAnalysisBuilder createNetworkAnalysisBuilder() {
		return new NetworkAnalysisBuilderImpl(this);
	}

	@Override
	public StreamFunction createConstant(double constValue) {
		return new AbstractStreamFunction() {
			@Override
			public double calc(CalcContext ctx) {
				return constValue;
			}
		};
	}

	@Override
	public StreamFunction createYearlyConnectedHouseHolds(int timeToConnection,
			double fairShare, double churnRate) {
		return new YearlyHouseHoldsConnectedPercent(timeToConnection,
				fairShare, churnRate);
	}

	@Override
	public RoicModelBuilder createRoicModelBuilder() {
		return new RoicAnalysisBuilder(this);
	}

	@Override
	public StreamFunction createMultiplyOp(CurveIdentifier id,
			CurveIdentifier id2) {
		return new TimesStreamFunction(id, id2);
	}

	@Override
	public StreamFunction createStreamDiff(CurveIdentifier id) {
		return new StreamDiff(id);
	}

	@Override
	public StreamFunction createARPU(double arpu) {
		return new AbstractStreamFunction() {
			@Override
			public double calc(CalcContext ctx) {
				return arpu;
			}
		};
	}

	@Override
	public StreamFunction createHouseHolds(double start, double growth) {
		return new GrowthCurve(start, growth);
	}

	@Override
	public StreamFunction createMultiplyOp(CurveIdentifier id, double constValue) {
		return new ValueTimesConstantOp(id, constValue);
	}

	@Override
	public StreamFunction createCost(double cost) {
		return new TruncatedConstantStream(cost, 1);

	}

	@Override
	public StreamFunction createPremisesPassed(double premises) {
		return new ConstStreamFunction(premises);
	}

	@Deprecated
	@Override
	public StreamFunction createSubscribersPenetration(
			CurveIdentifier penetrationId) {
		return null;
	}

	@Override
	public StreamFunction createSubscribersCount(CurveIdentifier penetrationId,
			double subscriberCount) {
		return new ValueTimesConstantOp(penetrationId, subscriberCount);
	}

	@Override
	public StreamFunction createMonthlyConnectedHouseHolds(double r,
			double hhGrowth, double churnRate, double churnDecrease) {
		Params params = new Params(r, hhGrowth, churnRate, churnDecrease);
		return new MonthlyHouseHoldsConnectedPercent(params);
	}

	@Override
	public StreamFunction createRevenue(CurveIdentifier hhId,
			CurveIdentifier penetrationId, CurveIdentifier arpuIdentifier) {
		return new StreamRevenue(hhId, penetrationId, arpuIdentifier);
	}

	@Override
	public StreamFunction createDeploymentCost(double cost) {
		return new TruncatedConstantStream(cost, 1);
	}

}
