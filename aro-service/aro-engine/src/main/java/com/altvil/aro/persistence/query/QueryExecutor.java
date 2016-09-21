package com.altvil.aro.persistence.query;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class QueryExecutor {
	
	@Autowired
	private DataSource dataSource;
	
	public NamedParameterJdbcTemplate templateAction() {
		return new NamedParameterJdbcTemplate(dataSource);
	}

}