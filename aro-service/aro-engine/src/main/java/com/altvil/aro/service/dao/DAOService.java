package com.altvil.aro.service.dao;

import com.altvil.aro.service.dao.generic.AroDAO;

public interface DAOService {

	public <T> Accessor<AroDAO<T>> generic(Class<T> clz);

	public <T> Accessor<T> dao(Class<T> clz);

	public Accessor<DAOSession> dao();

}
