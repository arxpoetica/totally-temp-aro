package com.altvil.aro.service.persistence;

import org.hibernate.Session;

public interface SessionAction<T> {
	T apply(Session session) ;
}