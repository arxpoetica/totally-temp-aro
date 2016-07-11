package com.altvil.aro.service.optimization.strategy.impl;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.strategy.*;
import com.altvil.aro.service.optimization.strategy.comparators.CapexNetworkComparator;
import com.altvil.aro.service.optimization.strategy.comparators.IrrNetoworkComparator;
import com.altvil.enumerations.OptimizationType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MultiAreaOptimizationEvaluatorServive implements OptimizationEvaluatorService {

    TargetEvaluatorFactory targetEvaluatorFactory;

    @Autowired
    public MultiAreaOptimizationEvaluatorServive(TargetEvaluatorFactory targetEvaluatorFactory) {
        this.targetEvaluatorFactory = targetEvaluatorFactory;
    }

    @Override
    public OptimizationEvaluator getOptimizationEvaluator(OptimizationConstraints constraints) {
        OptimizationNetworkComparator comparator=(constraints.getOptimizationType() == OptimizationType.IRR)
                ?new IrrNetoworkComparator(constraints.getYears())
                :new CapexNetworkComparator();


        return new MultiAreaEvaluator(comparator, targetEvaluatorFactory.getTargetEvaluator(constraints));
    }





}
