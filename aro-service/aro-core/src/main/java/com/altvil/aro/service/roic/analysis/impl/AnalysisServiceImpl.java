package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentBuilder;
import com.altvil.aro.service.roic.analysis.builder.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.builder.RoicModelBuilder;
import com.altvil.aro.service.roic.analysis.builder.impl.ComponentBuilderImpl;
import com.altvil.aro.service.roic.analysis.builder.impl.NetworkAnalysisBuilderImpl;
import com.altvil.aro.service.roic.analysis.builder.impl.RoicAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.impl.HouseHoldsConnectedPercent.Params;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public class AnalysisServiceImpl implements AnalysisService {

	@Override
	public StreamFunction createCurve(NetworkPenetration networkPenetration) {
		return new AnalysisCurve(networkPenetration);
	}

	@Override
	public ComponentBuilder createComponentBuilder() {
		return new ComponentBuilderImpl(this);
	}

	@Override
	public NetworkAnalysisBuilder createNetworkAnalysisBuilder() {
		return new NetworkAnalysisBuilderImpl(this);
	}
	
	
	
	

	@Override
	public RoicModelBuilder createRoicModelBuilder() {
		return new RoicAnalysisBuilder() ;
	}

	@Override
	public StreamFunction createMultiplyOp(CurveIdentifier id,
			CurveIdentifier id2) {
		return new TimesStreamFunction(id, id2) ;
	}

	@Override
	public StreamFunction createStreamDiff(CurveIdentifier id) {
		return new StreamDiff(id) ;
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
	public StreamFunction createConnectedHouseHolds(double r, double hhGrowth,
			double churnRate, double churnDecrease) {
		Params params = new Params(r, hhGrowth, churnRate, churnDecrease);
		return new HouseHoldsConnectedPercent(params);
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
