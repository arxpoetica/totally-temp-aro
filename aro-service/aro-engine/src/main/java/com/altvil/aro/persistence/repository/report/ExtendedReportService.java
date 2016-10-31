package com.altvil.aro.persistence.repository.report;

import java.io.IOException;
import java.io.Writer;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.query.QueryExecutor;

@Service
public class ExtendedReportService {

	@Autowired
	private QueryExecutor queryExecutor;

	private Map<String, String> sqlQueryMap = new HashMap<>();

	private String getSqlQuery(String reportName) {
		String sql = sqlQueryMap.get(reportName.toLowerCase());
		if (sql == null) {
			throw new RuntimeException("Unknown Report : " + reportName);
		}

		return sql;
	}

	public void queryReport(String reportName, long planId, Writer writer)
			throws SQLException, IOException {
		queryExecutor.queryAsCsv(getSqlQuery(reportName), writer,
				ps -> ps.setLong(1, planId));
	}

	@PostConstruct
	void postConstruct() {
		sqlQueryMap.put("tabc", "");
	}

}
