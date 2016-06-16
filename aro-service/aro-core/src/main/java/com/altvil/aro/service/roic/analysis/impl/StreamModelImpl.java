package com.altvil.aro.service.roic.analysis.impl;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public class StreamModelImpl implements StreamModel {

	private Map<CurveIdentifier, AnalysisRow> map;
	private AnalysisPeriod analysisPeriod;

	public StreamModelImpl(AnalysisPeriod analysisPeriod,
			Map<CurveIdentifier, AnalysisRow> map) {
		super();
		this.analysisPeriod = analysisPeriod;
		this.map = map;
	}
	

	@Override
	public Collection<CurveIdentifier> getCurveIdentifiers() {
		return map.keySet() ;
	}

	@Override
	public AnalysisPeriod getAnalysisPeriod() {
		return analysisPeriod;
	}

	private static int inferSize(Map<CurveIdentifier, AnalysisRow> map) {
		return map.isEmpty() ? 0 : map.values().iterator().next().getSize();
	}

	@Override
	public AnalysisRow getAnalysisRow(CurveIdentifier id) {
		return map.get(id);
	}

	@Override
	public Collection<AnalysisRow> getAnalysisRow() {
		return map.values();
	}

	@Override
	public StreamModel add(StreamModel other) {
		Map<CurveIdentifier, AnalysisRow> result = new HashMap<>();
		for (Map.Entry<CurveIdentifier, AnalysisRow> e : map.entrySet()) {
			result.put(
					e.getKey(),
					DefaultAnalyisRow.minus(e.getValue(),
							other.getAnalysisRow(e.getKey())));
		}

		return new StreamModelImpl(analysisPeriod, result);
	}

	@Override
	public StreamModel minus(StreamModel other) {
		Map<CurveIdentifier, AnalysisRow> result = new HashMap<>();
		for (Map.Entry<CurveIdentifier, AnalysisRow> e : map.entrySet()) {
			AnalysisRow row = other.getAnalysisRow(e.getKey());
			if (row != null) {
				row = DefaultAnalyisRow.sum(inferSize(map), Collections.singleton(row));
			}
			result.put(e.getKey(), row);
		}

		return new StreamModelImpl(analysisPeriod, result);
	}

}
