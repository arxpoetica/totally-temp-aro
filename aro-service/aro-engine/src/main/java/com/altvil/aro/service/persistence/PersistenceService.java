package com.altvil.aro.service.persistence;

import org.hibernate.SessionFactory;

public interface PersistenceService {

	
	/**
	 * 
	 * @return
	 */
	public SessionFactory getSessionFactory();
	
	/**
	 * 
	 * @param action
	 * @return
	 */
	public <T> T read(SessionAction<T> action) ;
	
	/**
	 * 
	 * @param action
	 * @return
	 */
	public <T> T modify(SessionAction<T> action) ;

	
}
