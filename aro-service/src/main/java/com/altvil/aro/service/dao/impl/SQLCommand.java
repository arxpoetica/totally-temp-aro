package com.altvil.aro.service.dao.impl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.dao.DAOException;

public class SQLCommand<A> {

	private static final Logger log = LoggerFactory
			.getLogger(DefaultSQLQuery.class.getName());

	private String cmd;
	
	public SQLCommand(String cmd) {
		super();
		this.cmd = cmd;
	}

	public boolean query(Connection connection, A args) throws DAOException, SQLException {
		if (log.isDebugEnabled()) {
			log.debug("Execute SQL " + cmd);
		}

		try {

			PreparedStatement ps = connection.prepareStatement(cmd);
			applyBinding(ps, args);
			
			return ps.execute() ;
			
		} catch (Throwable e) {
			throw new DAOException(e.getMessage(), e);
		} 

	}
	
	protected void applyBinding(PreparedStatement ps, A args)
			throws SQLException {
	}

}
