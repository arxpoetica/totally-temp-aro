package com.altvil.aro.service.dao.generic;

import java.io.Serializable;
import java.util.Collection;

import com.googlecode.genericdao.dao.hibernate.GenericDAO;
import com.googlecode.genericdao.search.ISearch;

public interface GenericAroDAO<T, ID extends Serializable> extends
		GenericDAO<T, ID> {

	void saveOrUpdate(T update);

	void saveOrUpdate(Collection<T> updates);
	
	public int delete(ISearch search) ;

}
