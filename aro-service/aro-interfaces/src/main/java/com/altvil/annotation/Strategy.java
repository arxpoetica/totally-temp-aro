package com.altvil.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.stereotype.Component;

/**
 * A strategy is a small(ish) class of code that can be applied in several places or as a way of abstracting out complex parts within a framework.
 * 
 * Strategies are groups by a type which should be an interface implemented by the group.  Within a group individual strategies are identified by their name.
 * @author Kevin
 *
 */
@Documented
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Component
public @interface Strategy {
	Class<?> type();
	String name();
}
