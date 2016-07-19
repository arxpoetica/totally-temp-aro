package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import org.apache.poi.ss.formula.functions.Irr;

import java.util.Arrays;

public class IrrNetoworkComparator extends AbstractNetworkComparator {

    int analysisYears;

    public IrrNetoworkComparator(int analysisYears) {
        this.analysisYears = analysisYears;
    }

    @Override
    protected double getIncrementalBenefit(OptimizedNetwork base, OptimizedNetwork compared) {

        return  compared.getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact() - (base != null? base.getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact():0);

    }

    @Override
    protected double getScore(OptimizedNetwork base, OptimizedNetwork compared) {
        // negated IRR of a cashflows difference
        return - Irr.irr(getCashFlows(getIncrementalCost(base,compared),
                compared.getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact() - (base != null?base.getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact():0)));

    }

    private double[] getCashFlows(double cost, double monthlyIncome) {
        double cashFlows[] = new double[analysisYears +1];
        Arrays.fill(cashFlows, monthlyIncome*12);
        cashFlows[0] = -cost;
        return cashFlows;
    }


}
