package com.altvil.aro.service.strategy;

import com.altvil.aro.service.strategy.NoSuchStrategy;

public interface StrategyService {
	<T> T getStrategy(Class<T> type, String name) throws NoSuchStrategy; 
	}
