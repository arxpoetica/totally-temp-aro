package com.altvil.aro.service.dao;

public interface Modification<T> {
	
	public void execute(T session) ;

}
