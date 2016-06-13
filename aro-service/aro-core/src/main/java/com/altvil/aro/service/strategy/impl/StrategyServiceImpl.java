package com.altvil.aro.service.strategy.impl;

import java.lang.annotation.Annotation;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.aop.framework.Advised;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.AnnotationUtils;
import org.springframework.stereotype.Repository;

import com.altvil.annotation.FiberPlanDefaultStrategy;
import com.altvil.annotation.FiberPlanStrategy;
import com.altvil.annotation.OptimizationPlanStrategy;
import com.altvil.annotation.StrategyStereotype;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.aro.service.strategy.StrategyService;

@Repository
public class StrategyServiceImpl implements StrategyService {
	private static class StrategyKey {
		final Enum<?>  algorithm;
		final Class<?> type;

		public StrategyKey(Class<?> type, Enum<?> algorithm) {
			this.type = type;
			this.algorithm = algorithm;
		}
		
		public String toString() {
			return type.getName() + "/" + algorithm;
		}

		@Override
		public boolean equals(Object obj) {
			if (obj == null)
				return false;

			StrategyKey other = (StrategyKey) obj;
			
			return (type == other.type && algorithm == other.algorithm);
		}

		@Override
		public int hashCode() {
			return algorithm == null ? 11 : algorithm.hashCode();
		}
	}

	private static final Logger			   LOG			   = LoggerFactory.getLogger(StrategyServiceImpl.class);

	@Autowired
	private ApplicationContext			   applicationContext;
	private final Map<StrategyKey, Object> knownStrategies = new HashMap<>();

	@Override
	public <T> T getStrategy(Class<T> type, Enum<?> algorithm) throws NoSuchStrategy {
		@SuppressWarnings("unchecked")
		T strategy = (T) knownStrategies.get(new StrategyKey(type, algorithm));

		if (strategy != null) {
			return strategy;
		}
		@SuppressWarnings("unchecked")
		T defaultStrategy = (T) knownStrategies.get(new StrategyKey(type, null));

		if (defaultStrategy != null) {
			return defaultStrategy;
		}

		throw new NoSuchStrategy(type, String.valueOf(algorithm));
	}

	/**
	 * Finds all beans annotated with NetworkStrategy. Does a quick sanity check
	 * so only one strategy exists for each profile.
	 * 
	 * @see Strategy
	 */
	@PostConstruct
	public void init() {
		applicationContext.getBeansWithAnnotation(StrategyStereotype.class).values().forEach((b) -> {
			register(b);
		});
	}

	private void register(Object bean) {
		if (bean instanceof Advised) {
			try {
				bean = ((Advised) bean).getTargetSource().getTarget();
			} catch (Exception e) {
				LOG.warn("Failed to get target of advised bean", e);
			}
		}

		for (Annotation annotation : bean.getClass().getDeclaredAnnotations()) {
			if (AnnotationUtils.isAnnotationMetaPresent(annotation.annotationType(), StrategyStereotype.class)) {
				// NOTE: Investigate whether the Annotation API provides anyway
				// to get the values of an annotation without directly casting
				// the annotation to its known type.
				if (annotation.annotationType() == FiberPlanStrategy.class) {
					FiberPlanStrategy fps = (FiberPlanStrategy) annotation;

					register(bean, fps.type(), fps.algorithms());
				} else if (annotation.annotationType() == FiberPlanDefaultStrategy.class) {
					FiberPlanDefaultStrategy fpds = (FiberPlanDefaultStrategy) annotation;

					register(bean, fpds.type(), (Enum<?>) null);
				} else if (annotation.annotationType() == OptimizationPlanStrategy.class) {
					OptimizationPlanStrategy fps = (OptimizationPlanStrategy) annotation;

					register(bean, fps.type(), fps.types());
				} else {
					LOG.error("Update StrategyService to support the strategy annotation: "
							+ annotation.annotationType().getName());
				}
			}
		}
	}

	private void register(Object bean, Class<?> type, Enum<?>[] algorithms) {
		for (Enum<?> algorithm : algorithms) {
			register(bean, type, algorithm);
		}
	}

	private void register(Object bean, Class<?> type, Enum<?> algorithm) {
		StrategyKey key = new StrategyKey(type, algorithm);

		final Object collision = knownStrategies.put(key, bean);
		if (collision != null) {
			throw new IllegalStateException(
					"Both " + collision.getClass() + " and " + bean.getClass() + " have identical strategies.");
		}
	}
}
