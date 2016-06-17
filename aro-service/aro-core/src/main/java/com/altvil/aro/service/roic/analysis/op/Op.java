package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.op.MonthlyHouseHoldsConnectedPercent.Params;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

public class Op {

	public static StreamFunction penetration(NetworkPenetration penetrationCurve) {
		return new AnalysisCurve(penetrationCurve);
	}

	public static StreamFunction penetration(double startShare,
			double endShare, double rate) {
		return new AnalysisCurve(new DefaultNetworkPenetration(startShare,
				endShare, rate));
	}
	

	public static StreamFunction cashFlow(CurveIdentifier revenueId,
			CurveIdentifier capexId, CurveIdentifier connectCapexId,
			CurveIdentifier networkCapexId) {
		return new CashFlow(revenueId, capexId, connectCapexId, networkCapexId);
	}

	public static StreamFunction constCurve(AnalysisRow row) {
		return new AbstractStreamFunction() {
			@Override
			public double calc(CalcContext ctx) {
				return row.getValue(ctx.getPeriod());
			}
		};
	}

	public static StreamFunction constCurveTruncated(double constValue,
			int endPeriod) {
		return new TruncatedConstantStream(constValue, endPeriod);
	}

	public static StreamFunction constCurve(double constValue) {
		return new AbstractStreamFunction() {
			@Override
			public double calc(CalcContext ctx) {
				return constValue;
			}
		};
	}

	public static StreamFunction connectedHouseHoldsYearly(
			int timeToConnection, double fairShare, double churnRate,
			double entityCount) {
		return new YearlyHouseHoldsConnectedPercent(timeToConnection,
				fairShare, churnRate, entityCount);
	}

	public static StreamFunction times(CurveIdentifier id, CurveIdentifier id2) {
		return new TimesStreamFunction(id, id2);
	}

	public static StreamFunction times(CurveIdentifier id, double constValue) {
		return new ValueTimesConstantOp(id, constValue);
	}

	public static StreamFunction monthlyConnectedHouseHolds(double r,
			double hhGrowth, double churnRate, double churnDecrease) {
		Params params = new Params(r, hhGrowth, churnRate, churnDecrease);
		return new MonthlyHouseHoldsConnectedPercent(params);
	}

	public static StreamFunction streamMinus(CurveIdentifier id) {
		return new StreamDiff(id);
	}

	public static StreamFunction growCurve(double start, double growth) {
		return new GrowthCurve(start, growth);
	}

	public static StreamFunction revenue(CurveIdentifier hhId,
			CurveIdentifier penetrationId, CurveIdentifier arpuIdentifier) {
		return new StreamRevenue(hhId, penetrationId, arpuIdentifier);
	}

}
