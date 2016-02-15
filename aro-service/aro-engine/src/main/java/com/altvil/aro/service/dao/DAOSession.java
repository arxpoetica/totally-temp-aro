package com.altvil.aro.service.dao;

import org.hibernate.Session;

import com.altvil.aro.service.dao.generic.AroDAO;



public interface DAOSession {
	
	public <T> AroDAO<T> generic(Class<T> clz);

	public <T> T dao(Class<T> dao);
	
	public Session getSession() ;

}
