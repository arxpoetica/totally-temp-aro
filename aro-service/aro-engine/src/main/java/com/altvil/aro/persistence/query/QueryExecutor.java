package com.altvil.aro.persistence.query;

import java.io.IOException;
import java.io.Writer;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import com.opencsv.CSVWriter;

@Service
public class QueryExecutor {
	
	@Autowired
	private DataSource dataSource;
	
	public NamedParameterJdbcTemplate templateAction() {
		return new NamedParameterJdbcTemplate(dataSource);
	}
	
	
	public void queryAsCsv(String sql, Writer writer, QueryBinder binder)
			throws SQLException, IOException {
		try (CSVWriter csvWriter = new CSVWriter(writer)) {
			execute(sql, ps -> {
				binder.bind(ps) ;
				try (ResultSet rs = ps.executeQuery()) {
					csvWriter.writeAll(rs, true);
				}
			});
		}

	}
	
	public void execute(String sql, PreparedStatementAction action) throws SQLException {
		try {
			try(PreparedStatement ps = dataSource.getConnection().prepareStatement("")) {
				action.doAction(ps);
			}
		} catch( SQLException e) {
			throw e ;
		}
		catch( Throwable err ) {
			throw new SQLException(err.getMessage(), err) ;
		}
	}

}