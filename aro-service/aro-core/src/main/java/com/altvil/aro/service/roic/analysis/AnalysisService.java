package com.altvil.aro.service.roic.analysis;

import com.altvil.aro.service.roic.analysis.builder.ComponentBuilder;
import com.altvil.aro.service.roic.analysis.builder.NetworkAnalysisBuilder;
import com.altvil.aro.service.roic.analysis.builder.RoicModelBuilder;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;

public interface AnalysisService {
	
	
	ComponentBuilder createComponentBuilder(NetworkType type) ;
	NetworkAnalysisBuilder createNetworkAnalysisBuilder() ;
	RoicModelBuilder createRoicModelBuilder() ;
	
	StreamFunction createCurve(AnalysisRow row) ;

	
	StreamFunction createCurve(NetworkPenetration networkPenetration);

	StreamFunction createTruncatedConstantStream(double constValue, int endPeriod) ;
	
	StreamFunction createARPU(double arpu);
	
	StreamFunction createConstant(double constValue) ;

	StreamFunction createHouseHolds(double start, double growth);

	StreamFunction createMultiplyOp(CurveIdentifier id, double cost);
	
	StreamFunction createMultiplyOp(CurveIdentifier id, CurveIdentifier id2);
	
	StreamFunction createCost(double cost);
	
	StreamFunction createPremisesPassed(double premises);
	
	StreamFunction createSubscribersPenetration(CurveIdentifier penetrationId);
	
	StreamFunction createSubscribersCount(CurveIdentifier penetrationId, double subscriberCount);

	
	StreamFunction createMonthlyConnectedHouseHolds(double r, double hhGrowth,
			double churnRate, double churnDecrease);
	
	//( (time to full connection) - (time t) ) * (fair share) * (1 + churn) * (starting HHs) / 75
	StreamFunction createYearlyConnectedHouseHolds(int timeToConnection,
			double fairShare, double churnRate, double houseHolds );
	
	StreamFunction createRevenue(CurveIdentifier hhId, CurveIdentifier penetrationId,
			CurveIdentifier arpuIdentifier) ;
	
	StreamFunction createDeploymentCost(double cost) ;
	
	StreamFunction createStreamDiff(CurveIdentifier id) ;
	
	StreamFunction createCashFlow(CurveIdentifier revenueId, CurveIdentifier capexId,
			CurveIdentifier connectCapexId, CurveIdentifier networkCapexId) ;
 
}
