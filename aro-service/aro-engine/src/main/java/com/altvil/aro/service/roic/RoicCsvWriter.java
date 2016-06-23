package com.altvil.aro.service.roic;

import java.io.IOException;
import java.io.Reader;
import java.io.Writer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;

import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.utils.StreamUtil;

@Service
public class RoicCsvWriter {

	@Autowired
	private RoicExportService roicExportService;
	@Autowired
	private RoicService roicService;

	@RequestMapping(value = "csv/roic/models/{id}/roic.csv", method = RequestMethod.GET, produces = "text/csv")
	@ResponseStatus(value = HttpStatus.OK)
	public void streamLargeCSV(
			@RequestParam(value = "$select", required = false) String select,
			Writer output) throws IOException {

		RoicModel model = roicService.getRoicModel(0);
		try(Reader reader = select == null || select.equals("") ? roicExportService
				.createCsvReader(model) : roicExportService.createCsvReader(
				model, StreamUtil.toStringList(select))) {
		
			int read = 0;
			char[] chars = new char[1024 * 4]; // size per read

			try {
				while ((read = reader.read(chars)) != -1) {
					output.write(chars, 0, read);
					output.flush(); // may change flush rate to more rows/flush
				}
			} finally {
				output.close();
			}
		
		}

		
	}

}
