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
        //sum of cashflows
        return analysisYears * 12 * (compared.getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact() - base.getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact())
                -getIncrementalCost(base,compared);

    }

    @Override
    protected double getScore(OptimizedNetwork base, OptimizedNetwork compared) {
        // negated IRR of a cashflows difference
        return - Irr.irr(getCashFlows(getIncrementalCost(base,compared),
                compared.getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact() - base.getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact()));

    }

    private double[] getCashFlows(double cost, double monthlyIncome) {
        double cashFlows[] = new double[analysisYears +1];
        Arrays.fill(cashFlows, monthlyIncome*12);
        cashFlows[0] = -cost;
        return cashFlows;
    }


}
