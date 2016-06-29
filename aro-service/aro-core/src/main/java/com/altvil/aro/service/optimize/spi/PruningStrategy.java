package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;

public interface PruningStrategy {

	// Verifies that a given generatingNode can considered in the pruning tree
	boolean isGeneratingNodeValid(GeneratingNode node);

	// Pruning can terminate if constraint satisfied
	boolean isConstraintSatisfied(NetworkAnalysis node);

	// Can this candidate network be rejected early
	boolean isCandidatePlan(OptimizedNetwork network);

}
