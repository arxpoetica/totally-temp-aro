package com.altvil.aro.service.optimization.strategy.impl;

import com.altvil.aro.service.optimization.strategy.OptimizationEvaluator;
import com.altvil.aro.service.optimization.strategy.comparators.OptimizationImprovement;
import com.altvil.aro.service.optimization.strategy.OptimizationNetworkComparator;
import com.altvil.aro.service.optimization.strategy.OptimizationTargetEvaluator;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.altvil.enumerations.OptimizationType;

import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.*;

public class MultiAreaEvaluator implements OptimizationEvaluator {

    OptimizationNetworkComparator comparator;
    Supplier<OptimizationTargetEvaluator> targetEvaluatorSupplier;
    private OptimizationType optimizationType;
    private Function<OptimizedNetwork, PlanAnalysis> on2pa;

    private final Logger log			 = LoggerFactory.getLogger(this.getClass());

    public MultiAreaEvaluator(OptimizationNetworkComparator comparator, Supplier<OptimizationTargetEvaluator> targetEvaluatorSupplier, OptimizationType optimizationType, Function<OptimizedNetwork, PlanAnalysis> on2pa) {
        this.comparator = comparator;
        this.targetEvaluatorSupplier = targetEvaluatorSupplier;
        this.optimizationType = optimizationType;
        this.on2pa = on2pa;
    }



    private class NetworkOptimizationIterator implements Comparable<NetworkOptimizationIterator>, Iterator<OptimizationImprovement>{
        Optional<OptimizationImprovement> currentBestImprovement = Optional.empty();
        SingleAreaAnalysis singleAreaAnalysis;

        public NetworkOptimizationIterator(SingleAreaAnalysis singleAreaAnalysis) {
            this.singleAreaAnalysis = singleAreaAnalysis;

            this.currentBestImprovement = getBestImprovement(singleAreaAnalysis, currentBestImprovement);

        }

        @Override
        public boolean hasNext() {
            return currentBestImprovement.isPresent();
        }

        @Override
        public OptimizationImprovement next() {
            OptimizationImprovement prevBestImprovement = currentBestImprovement.get();
            this.currentBestImprovement = getBestImprovement(singleAreaAnalysis, currentBestImprovement);
            return prevBestImprovement;
        }

        @Override
        public int compareTo(@NotNull NetworkOptimizationIterator o) {
            return Double.compare(currentBestImprovement.get().getScore(), o.currentBestImprovement.get().getScore());
        }

        private Optional<OptimizationImprovement> getBestImprovement(SingleAreaAnalysis prunedNetwork, Optional<OptimizationImprovement> baseImprovement) {
            PlanAnalysis base = baseImprovement.isPresent()? baseImprovement.get().getImproved(): null;
                return prunedNetwork.getPlanAnalysises().stream()
                        .filter(planAnalysis -> base == null || getRawCoverage(planAnalysis) > getRawCoverage(base))
                        .map(network -> comparator.calculateImprovement(base, network, prunedNetwork))
                        .min((o1, o2) -> Double.compare(o1.getScore(), o2.getScore()));
        }
    }


    @Override
    public Collection<PlannedNetwork> evaluateNetworks(Collection<PrunedNetwork> analysis) {
        try {
            PriorityQueue<NetworkOptimizationIterator> improvementIterators = analysis
                    .stream()
                    .map(this::toSingleAreaAnalysis)
                    .map(NetworkOptimizationIterator::new)
                    .filter(NetworkOptimizationIterator::hasNext)
                    .collect(toCollection(PriorityQueue::new));
            if (improvementIterators.isEmpty())
                return Collections.emptyList();
            OptimizationTargetEvaluator evaluator = targetEvaluatorSupplier.get();
            OptimizationImprovement improvement;
            do {
                NetworkOptimizationIterator iterator = improvementIterators.poll();
                improvement = iterator.next();
                if (iterator.hasNext())
                    improvementIterators.add(iterator);
            } while (evaluator.addNetwork(improvement) && !improvementIterators.isEmpty());

            Collection<PlannedNetwork> evaluatedNetworks = evaluator.getEvaluatedNetworks();
            return evaluatedNetworks;
        }catch (Throwable throwable){
            log.error(throwable.getLocalizedMessage(), throwable);
            throw throwable;
        }

    }

    private SingleAreaAnalysis toSingleAreaAnalysis(PrunedNetwork prunedNetwork) {
        return new SingleAreaAnalysis(prunedNetwork, prunedNetwork.getOptimizedNetworks().stream().map(on2pa).collect(Collectors.toList()));
    }

    private double getRawCoverage(PlanAnalysis planAnalysis) {
        return planAnalysis.getOptimizedNetwork().getAnalysisNode().getFiberCoverage().getRawCoverage();
    }


    @Override
    public PruningStrategy getPruningStrategy() {
        return new PruningStrategy() {
            @Override
            public boolean isGeneratingNodeValid(GeneratingNode node) {
                return true;
            }

            @Override
            public boolean isConstraintSatisfied(NetworkAnalysis node) {
                return false;
            }

            @Override
            public boolean isCandidatePlan(OptimizedNetwork network) {
                return true;
            }

			@Override
			public Predicate<GeneratingNode> getPrunePredicate() {
				return null;
			}
            
            
        };
    }

    @Override
    public ScoringStrategy getScoringStrategy() {
        if(optimizationType == OptimizationType.IRR){
            return (generatingNode) ->  generatingNode.getFiberCoverage().getMonthlyRevenueImpact() == 0?
                    0
                    : -generatingNode.getCapex()/generatingNode.getFiberCoverage().getMonthlyRevenueImpact();
        }else{
            return (generatingNode) -> generatingNode.getFiberCoverage().getRawCoverage() == 0?
                    0
                    : -generatingNode.getCapex()/generatingNode.getFiberCoverage().getRawCoverage();
        }
    }
}
