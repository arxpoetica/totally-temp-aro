package com.altvil.aro.service.roic.analysis;

import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public interface AnalysisService {

	StreamFunction createCurve(NetworkPenetration networkPenetration);

	StreamFunction createARPU(double arpu);

	StreamFunction createHouseHolds(double start, double growth);

	StreamFunction createMultiplyOp(CurveIdentifier id, double cost);
	
	StreamFunction createCost(double cost);
	
	StreamFunction createPremisesPassed(double premises);
	
	StreamFunction createSubscribersPenetration(CurveIdentifier penetrationId);
	
	StreamFunction createSubscribersCount(CurveIdentifier penetrationId, double subscriberCount);

	StreamFunction createConnectedHouseHolds(double r, double hhGrowth,
			double churnRate, double churnDecrease);
	
	StreamFunction createRevenue(CurveIdentifier hhId, CurveIdentifier penetrationId,
			CurveIdentifier arpuIdentifier) ;
	
	StreamFunction createDeploymentCost(double cost) ;

}
