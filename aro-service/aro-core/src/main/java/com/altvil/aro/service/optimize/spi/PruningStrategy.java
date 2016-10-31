package com.altvil.aro.service.optimize.spi;

import java.util.function.Predicate;

public interface PruningStrategy {

	public interface PredicateStrategy<T> {
	}
	
	public interface Modifier {
		<T> Modifier and(PredicateStrategy<T> stratgey, Predicate<T> predicate) ;
		<T> Modifier replace(PredicateStrategy<T> stratgey, Predicate<T> predicate) ;
		PruningStrategy commit() ;
	}
	
	 Modifier modify() ; 
	 <T> Predicate<T> getPredicate(PredicateStrategy<T> strategy) ;
	
	

//	/**
//	 * 
//	 * @return Predicate that Verifies that a given generatingNode can
//	 *         considered in the pruning tree
//	 */
//	Predicate<GeneratingNode> getPruneInitialCandidate();
//
//	// Verifies that a given generatingNode can considered in the pruning tree
//	boolean isGeneratingNodeValid(GeneratingNode node);
//
//	// Pruning can terminate if constraint satisfied
//	boolean isConstraintSatisfied(NetworkAnalysis node);
//
//	/**
//	 * 
//	 * @return Predicate that determines if Pruning can be terminates because
//	 *         constraint met.
//	 */
//	Predicate<NetworkAnalysis> constraintSatisfied();
//
//	// Can this candidate network be rejected early
//	boolean isCandidatePlan(OptimizedNetwork network);
//
//	/**
//	 * 
//	 * @return Predicate that identifies a candidate network which can be
//	 *         rejected early from Pruned Network set
//	 */
//	Predicate<OptimizedNetwork> getCandidatePlan();
//
//	/**
//	 * 
//	 * @return Predicate that identifies Generating Nodes that are valid Prune
//	 *         Nodes
//	 */
//	// PruneCandiate
//	Predicate<GeneratingNode> getPrunePredicate();

}
