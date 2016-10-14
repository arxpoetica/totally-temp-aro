package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.roic.CashFlows;
import org.apache.poi.ss.formula.functions.Irr;

import java.util.Arrays;

public class IrrNetoworkComparator extends AbstractNetworkComparator {

    int analysisYears;

    public IrrNetoworkComparator(int analysisYears) {
        this.analysisYears = analysisYears;
    }

    @Override
    protected double getIncrementalBenefit(PlanAnalysis base, PlanAnalysis compared) {

        return  compared.getOptimizedNetwork().getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact() - (base != null? base.getOptimizedNetwork().getAnalysisNode().getFiberCoverage().getMonthlyRevenueImpact():0);

    }

    @Override
    protected double getScore(PlanAnalysis base, PlanAnalysis compared) {
        // negated IRR of a cashflows difference
        return - Irr.irr(
                subtract(compared.getCashFlows(), (base != null ? base.getCashFlows() : null)));

    }

    private double[] subtract(CashFlows c1, CashFlows c2) {
       return  c1.subtract(c2).getAsRawData();

    }




}
