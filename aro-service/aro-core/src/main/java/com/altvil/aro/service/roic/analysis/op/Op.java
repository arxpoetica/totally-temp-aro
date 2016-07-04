package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
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

	public static StreamFunction divide(CurveIdentifier lhs, CurveIdentifier rhs) {
		return new BinaryOp(lhs, rhs) {
			@Override
			protected double doCalc(double lhs, double rhs) {

				if (rhs == 0) {
					return 0;
				}

				return lhs / rhs;
			}
		};

	}
	
	@FunctionalInterface
	public interface BinaryFunc {
		double calc(double lhs, double rhs) ;
	}
	
	public static StreamFunction binaryOp(CurveIdentifier lhs, CurveIdentifier rhs, BinaryFunc f) {
		return new BinaryOp(lhs, rhs) {
			@Override
			protected double doCalc(double lhs, double rhs) {
				return f.calc(lhs, rhs) ;
			}
		};
	}

	public static StreamFunction cashFlow(CurveIdentifier revenueId, CurveIdentifier maintenanceId,
			CurveIdentifier opExId, CurveIdentifier newConnectionsId,
			CurveIdentifier networkCostId) {
		return new CashFlow(revenueId, maintenanceId, opExId, newConnectionsId, networkCostId) ;
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
	
	public static StreamFunction ref(CurveIdentifier id) {
		return new UnaryRef(id) {
			@Override
			protected double doCalc(double val) {
				return val;
			}
		};
	}

	public static StreamFunction connectedHouseHoldsYearly(
			int timeToConnection, double fairShare, double churnRate,
			double entityCount) {
		return new YearlyHouseHoldsConnectedPercent(timeToConnection,
				fairShare, churnRate, entityCount);
	}

	public static StreamFunction multiply(CurveIdentifier id, CurveIdentifier id2) {
		return new BinaryOp(id, id2) {
			@Override
			protected double doCalc(double lhs, double rhs) {
				return lhs * rhs;
			}

		};
	}


	public static StreamFunction multiply(CurveIdentifier id, double constValue) {
		return new UnaryRef(id) {
			@Override
			protected double doCalc(double val) {
				return val * constValue ;
			}
			
		} ;
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
