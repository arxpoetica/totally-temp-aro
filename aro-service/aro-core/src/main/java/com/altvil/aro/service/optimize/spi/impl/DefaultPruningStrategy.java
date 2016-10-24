package com.altvil.aro.service.optimize.spi.impl;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Predicate;

import com.altvil.aro.service.optimize.spi.PredicateStrategyType;
import com.altvil.aro.service.optimize.spi.PruningStrategy;

public class DefaultPruningStrategy implements PruningStrategy {

	public static final PruningStrategy STRATEGY = new ModifierImpl(
			new HashMap<>())
			.replace(PredicateStrategyType.INITIAL_PRUNE_CANDIDATE,
					(node) -> false)
			.replace(PredicateStrategyType.PRUNE_CANDIDATE,
					(node) -> !node.isSourceEquipment())
			.replace(PredicateStrategyType.CONSTRAINT_STATISFIED,
					(node) -> false)
			.replace(PredicateStrategyType.CANDIDATE_PLAN,
					(network) -> network != null)

			.commit();

	private Map<PredicateStrategy<?>, Predicate<?>> map;

	private DefaultPruningStrategy(Map<PredicateStrategy<?>, Predicate<?>> map) {
		super();
		this.map = map;
	}

	private DefaultPruningStrategy() {
		this(new HashMap<PredicateStrategy<?>, Predicate<?>>());
	}

	@Override
	public Modifier modify() {
		return new ModifierImpl(map);
	}

	@SuppressWarnings("unchecked")
	@Override
	public <T> Predicate<T> getPredicate(PredicateStrategy<T> strategy) {
		return (Predicate<T>) map.get(strategy);
	}

	private static class ModifierImpl implements Modifier {

		private final Map<PredicateStrategy<?>, Predicate<?>> map;

		public ModifierImpl(Map<PredicateStrategy<?>, Predicate<?>> map) {
			super();
			this.map = new HashMap<>(map);
		}

		@Override
		public <T> Modifier and(PredicateStrategy<T> stratgey,
				Predicate<T> predicate) {
			@SuppressWarnings("unchecked")
			Predicate<T> originalPredicate = (Predicate<T>) map.get(stratgey);
			return replace(stratgey, originalPredicate.and(predicate));
		}

		@Override
		public <T> Modifier replace(PredicateStrategy<T> stratgey,
				Predicate<T> predicate) {

			map.put(stratgey, predicate);
			return this;
		}

		@Override
		public PruningStrategy commit() {
			return new DefaultPruningStrategy(map);
		}

	}

}
