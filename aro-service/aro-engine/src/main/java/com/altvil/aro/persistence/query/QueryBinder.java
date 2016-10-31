package com.altvil.aro.persistence.query;

import java.sql.PreparedStatement;
import java.sql.SQLException;

public interface QueryBinder {
	
	public void bind(PreparedStatement ps) throws SQLException ;

}
