package com.altvil.aro.service.dao.impl;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Collection;

import com.altvil.aro.service.dao.DAOException;
import com.altvil.aro.util.function.CollectionAggregator;

public class CollectionSQLQuery<A, T> {

	public static <A, T> CollectionSQLQuery<A, T> create(
			DefaultSQLQuery<A, T> sq) {
		return new CollectionSQLQuery<A, T>(sq);
	}

	private DefaultSQLQuery<A, T> sqlQuery;

	public CollectionSQLQuery(DefaultSQLQuery<A, T> sqlQuery) {
		super();
		this.sqlQuery = sqlQuery;
	}

	public Collection<T> query(Connection c, A args) throws DAOException,
			SQLException {
		return sqlQuery.query(c, args, new CollectionAggregator<T>()).result();
	}

}
