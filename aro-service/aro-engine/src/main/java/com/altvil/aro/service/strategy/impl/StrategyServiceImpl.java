package com.altvil.aro.service.strategy.impl;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.stereotype.Repository;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.Strategy;
import com.altvil.aro.service.graph.model.NetworkStrategy;
import com.altvil.aro.service.network.NetworkStrategyRequest;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.aro.service.strategy.StrategyService;

@Repository
public class StrategyServiceImpl implements StrategyService {
	private static class StrategyKey {
		final Class<?> type;
		final String name;
		
		public StrategyKey(Strategy strategy) {
			this.type = strategy.type();
			this.name = strategy.name();
		}

		public StrategyKey(Class<?> type, String name) {
			this.type = type;
			this.name = name;
		}

		@Override
		public int hashCode() {
			return  name.hashCode();
		}

		@Override
		public boolean equals(Object obj) {
			if (this == obj)
				return true;
			if (obj == null)
				return false;
			StrategyKey other = (StrategyKey) obj;
			if (!name.equals(other.name))
				return false;
			return (type == other.type);
		}
	}

    @Autowired
    private ApplicationContext applicationContext;
    private final Map<StrategyKey, Object> knownStrategies = new HashMap<>();
    
    /**
     * Finds all beans annotated with NetworkStrategy. Does a quick sanity
     * check so only one strategy exists for each profile.
     * @see Strategy
     */
    @PostConstruct
    public void init() {
    	applicationContext.getBeansWithAnnotation(Strategy.class).values().forEach((b) -> {
    		Strategy annotation = AnnotationUtils.findAnnotation(b.getClass(), Strategy.class);
    		StrategyKey key = new StrategyKey(annotation);
    		
    		final Object collision = knownStrategies.put(key, b);
			if (collision != null) {
    			throw new IllegalStateException("Both " + collision.getClass() + " and " + b.getClass() + " have identical strategies.");
    		}
    		
    	});
    }

	@Override
	public <T> T getStrategy(Class<T> type, String name) throws NoSuchStrategy {
		StrategyKey key = new StrategyKey(type, name);
		@SuppressWarnings("unchecked")
		T strategy = (T) knownStrategies.get(key);
		
		if (strategy == null) {
			throw new NoSuchStrategy(type, name);
		}
		
		return strategy;
	}

}
