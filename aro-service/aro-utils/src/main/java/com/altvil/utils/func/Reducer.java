package com.altvil.utils.func;

public interface Reducer<S, D> {

	public void add(S val) ;
	public D apply() ;
	
}
