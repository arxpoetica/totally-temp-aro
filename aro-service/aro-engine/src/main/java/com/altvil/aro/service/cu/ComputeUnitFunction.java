package com.altvil.aro.service.cu;

@FunctionalInterface
public interface ComputeUnitFunction<T> {
	T load();
}
