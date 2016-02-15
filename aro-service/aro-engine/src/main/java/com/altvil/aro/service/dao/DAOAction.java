package com.altvil.aro.service.dao;

public interface DAOAction<T> {

	public T execute(DAOSession session) ;
	
}
