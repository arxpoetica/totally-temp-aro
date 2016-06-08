package com.altvil.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.altvil.enumerations.OptimizationType;

@Documented
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@StrategyStereotype
public @interface OptimizationPlanStrategy {
	Class<?> type();
	OptimizationType[] types();
}
