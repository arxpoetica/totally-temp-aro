package com.altvil.aro.service.optimization.strategy.impl;

import com.altvil.aro.service.optimization.strategy.OptimizationEvaluator;
import com.altvil.aro.service.optimization.strategy.comparators.OptimizationImprovement;
import com.altvil.aro.service.optimization.strategy.OptimizationNetworkComparator;
import com.altvil.aro.service.optimization.strategy.OptimizationTargetEvaluator;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.PriorityQueue;
import java.util.function.Function;

import static java.util.stream.Collectors.*;

public class MultiAreaEvaluator implements OptimizationEvaluator {

    OptimizationNetworkComparator comparator;
    OptimizationTargetEvaluator targetEvaluator;

    public MultiAreaEvaluator(OptimizationNetworkComparator comparator, OptimizationTargetEvaluator targetEvaluator) {
        this.comparator = comparator;
        this.targetEvaluator = targetEvaluator;
    }

    @Override
    public Collection<PlannedNetwork> evaluateNetworks(Collection<PrunedNetwork> analysis) {

        Map<Long, PrunedNetwork> id2prunedNetwork = analysis.stream().collect(toMap(PrunedNetwork::getWirecenterId, Function.identity()));

        Map<Long, Optional<OptimizedNetwork>> resultNetworks = analysis.stream().collect(toMap(PrunedNetwork::getWirecenterId,
                prunedNetwork -> prunedNetwork.getOptimizedNetworks().stream()
                .filter(optimizedNetwork -> optimizedNetwork.getAnalysisNode().getFiberCoverage().getRawCoverage() == 0).findFirst()));

        PriorityQueue<OptimizationImprovement> improvementsPriorityQueue = analysis.stream().map(prunedNetwork -> getBestImprovement(prunedNetwork, resultNetworks.get(prunedNetwork.getWirecenterId()))).collect(toCollection(PriorityQueue::new));

        while(! isTargetMet(resultNetworks) && !improvementsPriorityQueue.isEmpty()){
            OptimizedNetwork improvedNetwork = improvementsPriorityQueue.poll().getImproved();
            resultNetworks.put(
                    improvedNetwork.getWirecenterId(),
                    Optional.of(improvedNetwork));
            improvementsPriorityQueue.add(getBestImprovement(id2prunedNetwork.get(improvedNetwork.getWirecenterId()),Optional.of(improvedNetwork)).get());
        }

        return resultNetworks.values()
                .stream()
                .filter(Optional::isPresent)
                .map(Optional::get)
                .map(this::toPlannedNetwork)
                .collect(toList());


    }

    private PlannedNetwork toPlannedNetwork(OptimizedNetwork optimizedNetwork) {
        //todo get it from single area evaluator
        throw new UnsupportedOperationException();
    }

    private boolean isTargetMet(Map<Long, Optional<OptimizedNetwork>> resultNetworks) {
        return targetEvaluator.isTargetMet(
                resultNetworks.values()
                        .stream()
                        .filter(Optional::isPresent)
                        .map(Optional::get)
                        .collect(toList()));
    }

    private Optional<OptimizationImprovement> getBestImprovement(PrunedNetwork prunedNetwork, Optional<OptimizedNetwork> baseOptional) {
        if(baseOptional.isPresent()){
            OptimizedNetwork base = baseOptional.get();
            return prunedNetwork.getOptimizedNetworks().stream()
                    .filter(optimizedNetwork -> getRawCoverage(optimizedNetwork) > getRawCoverage(base))
                    .map(network -> comparator.calculateImprovement(base, network))
                    .max((o1, o2) -> Double.compare(o1.getScore(), o2.getScore()));
        }
        else {
            return Optional.empty();
        }


    }

    private double getRawCoverage(OptimizedNetwork optimizedNetwork) {
        return optimizedNetwork.getAnalysisNode().getFiberCoverage().getRawCoverage();
    }


    @Override
    public PruningStrategy getPruningStrategy() {
        return null;
    }

    @Override
    public ScoringStrategy getScoringStrategy() {
        return null;
    }
}
