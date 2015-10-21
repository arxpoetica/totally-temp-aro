package com.altvil.aro.service.dao.impl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.dao.DAOException;
import com.altvil.aro.util.function.Aggregator;
import com.altvil.aro.util.function.Transform;

public class DefaultSQLQuery<A, T> {

	private String query;
	private Transform<ResultSet, T> fResultSet;

	private static final Logger log = LoggerFactory
			.getLogger(DefaultSQLQuery.class.getName());

	public DefaultSQLQuery(String query,
			Transform<ResultSet, T> fResultSet) {
		super();
		this.query = query;
		this.fResultSet = fResultSet;
	}

	public <S extends Aggregator<T>> S query(Connection connection, A args,
			final S accumlator) throws DAOException, SQLException {
		if (log.isDebugEnabled()) {
			log.debug("Execute SQL " + query);
		}

		try {

			PreparedStatement ps = connection.prepareStatement(query);
			applyBinding(ps, args);
			try (ResultSet rs = ps.executeQuery()) {
				while (rs.next()) {
					accumlator.apply(fResultSet.apply(rs));
				}
			}
		} catch (Throwable e) {
			throw new DAOException(e.getMessage(), e);
		} 

		return accumlator;
	}

	protected void applyBinding(PreparedStatement ps, A args)
			throws SQLException {
	}

}
