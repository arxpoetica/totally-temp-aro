package com.altvil.aro.service.dao.impl;

import java.sql.PreparedStatement;

public interface SqlQuery {

	/**
	 * 
	 * @return
	 */
	public String getQuery() ;
	
	/**
	 * 
	 * @param ps
	 */
	public default void applyBindings(PreparedStatement ps){
	}
	
}
