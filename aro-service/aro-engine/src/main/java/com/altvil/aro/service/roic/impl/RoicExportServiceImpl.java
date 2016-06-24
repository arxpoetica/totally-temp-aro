package com.altvil.aro.service.roic.impl;

import java.io.IOException;
import java.io.PipedReader;
import java.io.PipedWriter;
import java.io.PrintWriter;
import java.io.Reader;
import java.util.Collection;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.RoicExportService;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.RowReference;

@Service
public class RoicExportServiceImpl implements RoicExportService {


	private static final Logger log = LoggerFactory
			.getLogger(RoicExportServiceImpl.class.getName());

	private ExecutorService executorService;

	@PostConstruct
	void postConstruct() {
		executorService = Executors.newCachedThreadPool();
	}

	@Override
	public Reader createCsvReader(Collection<RowReference> rows)
			throws IOException {
		return toReader(rows);
	}

	private PipedReader toReader(Collection<RowReference> rows)
			throws IOException {
		PipedWriter pipedWriter = new PipedWriter();

		PipedReader pipedReader = new PipedReader(pipedWriter);

		executorService.submit(() -> {
			try (PrintWriter pw = new PrintWriter(pipedWriter)) {

				Consumer<RowReference> sink = createRowWriter(pw);
				for (RowReference rr : rows) {
					sink.accept(rr);
				}
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
			}

		});

		return pipedReader;

	}

	private Consumer<RowReference> createRowWriter(PrintWriter ps) {
		return (rr) -> {
			ps.print('"');
			ps.print(rr.getIdentifier().toString());
			ps.print('"');

			AnalysisRow r = rr.getAnalysisRow();

			for (int i = 0; i < r.getSize(); i++) {
				ps.print(",");
				ps.print(r.getValue(i));
			}

			ps.println();
		};
	}

}
