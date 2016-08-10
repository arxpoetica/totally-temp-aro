package com.altvil.utils.lock;

@FunctionalInterface
public interface ResourceAction<T> {

	T execute();

}
