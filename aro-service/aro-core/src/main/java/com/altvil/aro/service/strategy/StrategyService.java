package com.altvil.aro.service.strategy;

import com.altvil.aro.service.strategy.NoSuchStrategy;

public interface StrategyService {
	/**
	 * Identifies the strategy matching the criteria. When no exact match
	 * is found performs an implicit search with the algorithm set to null to
	 * locate the default implementation for this type.
	 * 
	 * @param type - An interface provided by the returned strategy
	 * @param algorithm - An identifier that serves to group strategies into a functional unit.
	 * @return
	 * @throws NoSuchStrategy
	 */
	<T> T getStrategy(Class<T> type, Enum<?> algorithm) throws NoSuchStrategy;
}
