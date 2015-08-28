package com.altvil.aro.service.dao.impl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import org.hibernate.SessionFactory;
import org.hibernate.jdbc.Work;

import com.altvil.aro.service.dao.DAOException;
import com.altvil.aro.util.function.Aggregator;
import com.altvil.aro.util.function.Transform;

public class AbstractQuery<A, T> {
	
	private SessionFactory sessionFactory ;
	private String query ;
	private Transform<ResultSet, T> fResultSet ;
	
	
	public AbstractQuery(SessionFactory sessionFactory, String query,
			Transform<ResultSet, T> fResultSet) {
		super();
		this.sessionFactory = sessionFactory;
		this.query = query;
		this.fResultSet = fResultSet;
	}

	public  <S extends Aggregator<T>> S query(A args, final S accumlator) throws DAOException {
		sessionFactory.getCurrentSession().doWork(new Work() {	
			@Override
			public void execute(Connection connection) throws SQLException {
				try {
					PreparedStatement ps = connection.prepareStatement(query) ;
					applyBinding(ps, args);
					try(ResultSet rs = ps.executeQuery()) {
						while(rs.next()) {
							accumlator.apply(fResultSet.apply(rs)) ;
						}
					}
				} catch (Throwable e) {
					throw new DAOException(e.getMessage(), e) ;
				}
			}
		});
		
		return accumlator ;
	}
	
	protected void applyBinding(PreparedStatement ps, A args) throws SQLException {
	}

}
