package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.strategy.OptimizationTargetEvaluator;
import com.altvil.aro.service.optimization.strategy.TargetEvaluatorFactory;
import com.altvil.aro.service.optimization.strategy.comparators.OptimizationImprovement;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultPlannedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.enumerations.OptimizationType;
import org.apache.poi.ss.formula.functions.Irr;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import static java.util.stream.Collectors.toList;

@Service
public class TargetEvaluatorFactoryImpl implements TargetEvaluatorFactory{

    @Override
    public OptimizationTargetEvaluator getTargetEvaluator(ThresholdBudgetConstraint constraints) {
        if(constraints.getOptimizationType() == OptimizationType.IRR)
            return new IRREvaluator(constraints.getThreshhold(), constraints.getCapex(), constraints.getYears());
        else
            return new CoverageEvaluator(constraints.getThreshhold(), constraints.getCapex());
    }


    private abstract class AbstractOptimizationTargetEvaluator implements OptimizationTargetEvaluator{

        Double threshold;
        Double capexThreshold;

        private Map<Long, OptimizationImprovement> optimizedNetworkMap = new ConcurrentHashMap<>();

        public AbstractOptimizationTargetEvaluator(Double threshold, Double capexThreshold) {
            this.threshold = threshold;
            this.capexThreshold = capexThreshold;
        }

        protected void setOptimizedNetwork(OptimizationImprovement optimizationImprovement){
            optimizedNetworkMap.put(optimizationImprovement.getPlanId(), optimizationImprovement);
        }


        @Override
        public Collection<PlannedNetwork> getEvaluatedNetworks() {
            return optimizedNetworkMap
                    .entrySet()
                    .stream()
                    .map(entry -> toPlannedNetwork(entry.getKey(), entry.getValue().getImproved(), entry.getValue().getPrunedNetwork().getCompetitiveDemandMapping()))
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(toList());
        }

        protected Optional<PlannedNetwork> toPlannedNetwork(long planId, OptimizedNetwork optimizedNetwork, CompetitiveDemandMapping competitiveDemandMapping) {


            Optional<CompositeNetworkModel> p = optimizedNetwork.getNetworkPlan();
            if (!p.isPresent()) {
                return Optional.empty();
            }

            return Optional.of(new DefaultPlannedNetwork(planId, optimizedNetwork.getNetworkPlan().get(), competitiveDemandMapping));

        }
    }

    private class CoverageEvaluator extends AbstractOptimizationTargetEvaluator{

        double currentCapex = 0;
        double currentCoverage = 0;

        public CoverageEvaluator(Double threshold, Double capexThreshold) {
            super(threshold, capexThreshold);
        }

        @Override
        public boolean addNetwork(OptimizationImprovement optImprovement) {
            if(currentCapex + optImprovement.getIncrementalCost() > capexThreshold )
                return false;
            setOptimizedNetwork(optImprovement);
            currentCapex += optImprovement.getIncrementalCost();
            currentCoverage += optImprovement.getIncrementalBeneift();
            return currentCoverage >= threshold;
        }
    }

    private class IRREvaluator extends AbstractOptimizationTargetEvaluator{

        private final int analysisYears;
        double currentCapex = 0;
        double currentMonthlyIncrementalImpact = 0;

        public IRREvaluator(Double threshold, Double capexThreshold, int analysisYears) {
            super(threshold, capexThreshold);
            this.analysisYears = analysisYears;
        }

        @Override
        public boolean addNetwork(OptimizationImprovement optimizationImprovement) {
            if(currentCapex + optimizationImprovement.getIncrementalCost() > capexThreshold )
                return false;
            if(getIRR(currentCapex + optimizationImprovement.getIncrementalCost(), currentMonthlyIncrementalImpact+optimizationImprovement.getIncrementalBeneift()) < threshold)
                return false;
            setOptimizedNetwork(optimizationImprovement);
            currentCapex += optimizationImprovement.getIncrementalCost();
            currentMonthlyIncrementalImpact += optimizationImprovement.getIncrementalBeneift();
            return true;
        }
        private double getIRR(double cost, double monthlyIncome) {
            double cashFlows[] = new double[analysisYears +1];
            Arrays.fill(cashFlows, monthlyIncome * 12);
            cashFlows[0] = -cost;
            return Irr.irr(cashFlows);
        }
    }





}
