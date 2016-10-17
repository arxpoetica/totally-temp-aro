package com.altvil.aro.service.optimization.strategy;

import static java.util.stream.Collectors.toList;

import java.util.Arrays;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.poi.ss.formula.functions.Irr;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.strategy.comparators.OptimizationImprovement;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultPlannedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.enumerations.OptimizationType;

@Service
public class TargetEvaluatorFactoryImpl implements TargetEvaluatorFactory{

	@Autowired
	private ApplicationContext applicationContext ;
	
	
    @Override
    public OptimizationTargetEvaluator getTargetEvaluator(ThresholdBudgetConstraint constraints) {
        if(constraints.getOptimizationType() == OptimizationType.IRR)
            if(constraints.getThreshhold() == Double.NaN && constraints.getCapex() == Double.POSITIVE_INFINITY)
                return new UnconstrainedIRREvaluator(constraints.getThreshhold(), constraints.getCapex());
            else
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

        protected OptimizationImprovement getOptimizedNetwork(long planId){
            return optimizedNetworkMap.get(planId);
        }


        @Override
        public Collection<PlannedNetwork> getEvaluatedNetworks() {
            return optimizedNetworkMap
                    .entrySet()
                    .stream()
                    .map(entry -> toPlannedNetwork(entry.getKey(), entry.getValue().getImproved().getOptimizedNetwork(), entry.getValue().getSingleAreaAnalysis().getCompetitiveDemandMapping()))
                    .filter(Optional::isPresent)
                    .map(Optional::get)
                    .collect(toList());
        }

        protected Optional<PlannedNetwork> toPlannedNetwork(long planId, OptimizedNetwork optimizedNetwork, CompetitiveDemandMapping competitiveDemandMapping) {


            Optional<CompositeNetworkModel> p = optimizedNetwork.getNetworkPlan(applicationContext);
            if (!p.isPresent()) {
                return Optional.empty();
            }

            return Optional.of(new DefaultPlannedNetwork(planId, optimizedNetwork.getNetworkPlan(applicationContext).get(), competitiveDemandMapping));

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

    private class UnconstrainedIRREvaluator extends AbstractOptimizationTargetEvaluator{


        public UnconstrainedIRREvaluator(Double threshold, Double capexThreshold) {
            super(threshold, capexThreshold);
        }

        @Override
        public boolean addNetwork(OptimizationImprovement optImprovement) {
            if(getOptimizedNetwork(optImprovement.getPlanId()) == null)
                setOptimizedNetwork(optImprovement);
            return true;
        }
    }

    private class IRREvaluator extends AbstractOptimizationTargetEvaluator{

        double currentCapex = 0;
        double[] currentCashFlow ;

        public IRREvaluator(Double threshold, Double capexThreshold, int analysisYears) {
            super(threshold, capexThreshold);
            this.currentCashFlow = new double[analysisYears];
        }

        @Override
        public boolean addNetwork(OptimizationImprovement optimizationImprovement) {
            if(currentCapex + optimizationImprovement.getIncrementalCost() > capexThreshold )
                return false;


            double irr = Irr.irr(sum(currentCashFlow, optimizationImprovement.getIncrementalCashFlow()));
            if( irr < threshold)
                return false;
            setOptimizedNetwork(optimizationImprovement);
            currentCapex += optimizationImprovement.getIncrementalCost();
            currentCashFlow = sum(currentCashFlow , optimizationImprovement.getIncrementalCashFlow());
            return true;
        }

    }

    private double[] sum(double[] c1, double[] c2) {
        double[] result = new double[c1.length];
        for (int i = 0; i < c1.length; i++) {
            result[i] = c1[i]+c2[i];
        }
        return result;
    }


}
