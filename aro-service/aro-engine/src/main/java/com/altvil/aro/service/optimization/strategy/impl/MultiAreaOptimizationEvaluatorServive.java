package com.altvil.aro.service.optimization.strategy.impl;

import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluator;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluatorService;
import com.altvil.aro.service.optimization.strategy.OptimizationNetworkComparator;
import com.altvil.aro.service.optimization.strategy.TargetEvaluatorFactory;
import com.altvil.aro.service.optimization.strategy.comparators.CapexNetworkComparator;
import com.altvil.aro.service.optimization.strategy.comparators.IrrNetoworkComparator;
import com.altvil.enumerations.OptimizationType;

@Service("multiEvaluator")
public class MultiAreaOptimizationEvaluatorServive implements OptimizationEvaluatorService {

    TargetEvaluatorFactory targetEvaluatorFactory;
    private PlanAnalysisService planAnalysisService;

    @Autowired
    public MultiAreaOptimizationEvaluatorServive(TargetEvaluatorFactory targetEvaluatorFactory, PlanAnalysisService planAnalysisService) {
        this.targetEvaluatorFactory = targetEvaluatorFactory;
        this.planAnalysisService = planAnalysisService;
    }

    @Override
    public OptimizationEvaluator getOptimizationEvaluator(ThresholdBudgetConstraint constraints) {
        OptimizationNetworkComparator comparator=(constraints.getOptimizationType() == OptimizationType.IRR)
                ?new IrrNetoworkComparator(constraints.getYears())
                :new CapexNetworkComparator();


        return new MultiAreaEvaluator(comparator, () -> targetEvaluatorFactory.getTargetEvaluator(constraints), constraints.getOptimizationType(), planAnalysisService.createPlanAnalysis(constraints.getYears(), constraints.getDiscountRate()));
    }





}
