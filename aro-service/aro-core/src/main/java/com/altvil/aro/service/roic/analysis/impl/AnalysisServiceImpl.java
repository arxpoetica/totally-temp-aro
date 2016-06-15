package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentBuilder;
import com.altvil.aro.service.roic.analysis.builder.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public class AnalysisServiceImpl implements AnalysisService {

	@Override
	public StreamFunction createCurve(NetworkPenetration networkPenetration) {
		return new AnalysisCurve(networkPenetration) ;
	}
	
	

	@Override
	public ComponentBuilder createComponentBuilder() {
		// TODO Auto-generated method stub
		return null;
	}



	@Override
	public NetworkAnalysisBuilder createNetworkAnalysisBuilder() {
		// TODO Auto-generated method stub
		return null;
	}



	@Override
	public StreamFunction createARPU(double arpu) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public StreamFunction createHouseHolds(double start, double growth) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public StreamFunction createMultiplyOp(CurveIdentifier id, double cost) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public StreamFunction createCost(double cost) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public StreamFunction createPremisesPassed(double premises) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public StreamFunction createSubscribersPenetration(
			CurveIdentifier penetrationId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public StreamFunction createSubscribersCount(CurveIdentifier penetrationId,
			double subscriberCount) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public StreamFunction createConnectedHouseHolds(double r, double hhGrowth,
			double churnRate, double churnDecrease) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public StreamFunction createRevenue(CurveIdentifier hhId,
			CurveIdentifier penetrationId, CurveIdentifier arpuIdentifier) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public StreamFunction createDeploymentCost(double cost) {
		// TODO Auto-generated method stub
		return null;
	}
	
	

}
