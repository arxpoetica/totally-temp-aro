package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.PruningStrategy.PredicateStrategy;

public class PredicateStrategyType<T> implements PredicateStrategy<T> {

	/**
	 * 
	 * @return Predicate that Verifies that a given generatingNode can
	 *         considered in the pruning tree
	 */
	public static final PredicateStrategyType<GeneratingNode> INITIAL_PRUNE_CANDIDATE = new PredicateStrategyType<>(
			GeneratingNode.class);

	/**
	 * 
	 * @return Strategy that identifies Generating Nodes that are valid Prune
	 *         Nodes
	 */
	//
	public static final PredicateStrategyType<GeneratingNode> PRUNE_CANDIDATE = new PredicateStrategyType<>(
			GeneratingNode.class);

	/**
	 * 
	 * @return Predicate that determines if Pruning can be terminates because
	 *         constraint met.
	 */

	public static final PredicateStrategyType<NetworkAnalysis> CONSTRAINT_STATISFIED = new PredicateStrategyType<>(
			NetworkAnalysis.class);;

	/**
	 * 
	 * @return Strategy Type that identifies a candidate network which can be
	 *         rejected early from Pruned Network set
	 */

	public static final PredicateStrategyType<OptimizedNetwork> CANDIDATE_PLAN = new PredicateStrategyType<>(
			OptimizedNetwork.class);

	private PredicateStrategyType(Class<T> clz) {
	}

}
