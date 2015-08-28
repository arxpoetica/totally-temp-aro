package com.altvil.aro.service.dao.generic.impl;

import java.io.Serializable;

import org.hibernate.SessionFactory;

import com.altvil.aro.service.dao.generic.AroDAO;

public class AroDAOImpl<T> extends DefaultAroDAO<T, Serializable> implements
		AroDAO<T> {

	public AroDAOImpl(SessionFactory sessionFactory, Class<T> clz) {
		super(sessionFactory, clz);
	}


}
