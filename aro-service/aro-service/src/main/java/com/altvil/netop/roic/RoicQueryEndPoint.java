package com.altvil.netop.roic;

import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.roic.RoicExportService;
import com.altvil.aro.service.roic.RoicQueryService;
import com.altvil.aro.service.roic.analysis.RowReference;
import com.altvil.utils.StreamUtil;

@RestController
public class RoicQueryEndPoint {

	@Autowired
	private RoicQueryService roicQueryService;
	@Autowired
	private RoicExportService roicExportService;

	@RequestMapping(value = "/roic/models/{id}", method = RequestMethod.GET)
	public @ResponseBody List<RoicCurve> getEquipmentSummary(
			@PathVariable("id") long planId,
			@RequestParam(value = "$select", required = false) String selectClause) {

		return toRoicColumns(planId, selectClause)
				.stream()
				.map(rr -> new RoicCurve(rr.getIdentifier().toString(), rr
						.getAnalysisRow().getRawData()))
				.collect(Collectors.toList());

	}

	public static class RoicCurve {
		private String name;
		double[] values;

		public RoicCurve(String name, double[] values) {
			super();
			this.name = name;
			this.values = values;
		}

		public String getName() {
			return name;
		}

		public void setName(String name) {
			this.name = name;
		}

		public double[] getValues() {
			return values;
		}

		public void setValues(double[] values) {
			this.values = values;
		}

	}

	private static List<String> toStringList(String s) {
		return StreamUtil.map(s.split(","), String::trim);
	}

	@RequestMapping(value = "roic/models/{id}.csv", method = RequestMethod.GET, produces = "text/csv")
	@ResponseStatus(value = HttpStatus.OK)
	public void streamLargeCSV(
			@PathVariable("id") long planId,
			@RequestParam(value = "$select", required = false) String selectClause,
			Writer output) throws IOException {

		try (Reader reader = roicExportService.createCsvReader(toRoicColumns(
				planId, selectClause))) {
			copy(reader, output);
		} finally {
			output.close();
		}
	}

	private Collection<RowReference> toRoicColumns(long planId,
			String selectClause) {
		return (selectClause == null || selectClause == null) ? roicQueryService
				.queryRoicAll(planId) : roicQueryService.queryRoic(planId,
				toStringList(selectClause));
	}

	private static void copy(Reader reader, Writer writer) throws IOException {
		int read = 0;
		char[] chars = new char[1024 * 4]; // size per read
		while ((read = reader.read(chars)) != -1) {
			writer.write(chars, 0, read);
			writer.flush(); // may change flush rate to more rows/flush
		}
	}

}
