package com.altvil.aro.persistence.query;

import java.sql.PreparedStatement;

public interface PreparedStatementAction {
	
	public void doAction(PreparedStatement ps) throws Exception ;

}
