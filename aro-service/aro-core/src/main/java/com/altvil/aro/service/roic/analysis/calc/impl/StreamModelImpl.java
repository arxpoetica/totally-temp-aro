package com.altvil.aro.service.roic.analysis.calc.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.model.builder.DefaultAnalyisRow;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

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
		return map.keySet();
	}

	@Override
	public AnalysisPeriod getAnalysisPeriod() {
		return analysisPeriod;
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
	public StreamModel mask(Set<CurveIdentifier> ids) {
		return new StreamModelImpl(analysisPeriod, map.entrySet().stream()
				.filter(e -> ids.contains(e.getClass()))
				.collect(Collectors.toMap(e -> e.getKey(), e -> e.getValue())));
	}

	@Override
	public StreamModel add(Collection<StreamModel> others) {
		List<StreamModel> allStreams = new ArrayList<>(others);

		Map<CurveIdentifier, List<AnalysisRow>> arrayMap = new HashMap<>();
		allStreams.forEach(s -> {
			s.getCurveIdentifiers().forEach(id -> {
				List<AnalysisRow> rows = arrayMap.get(id);
				if (rows == null) {
					arrayMap.put(id, rows = new ArrayList<>());
				}
				rows.add(s.getAnalysisRow(id));
			});
		});

		Map<CurveIdentifier, AnalysisRow> result = new HashMap<>();
		arrayMap.entrySet().forEach(e -> {
			result.put(e.getKey(), DefaultAnalyisRow.sum(e.getValue()));
		});

		return new StreamModelImpl(analysisPeriod, result) ;

	}

	@Override
	public StreamModel add(StreamModel other) {
		return add(Collections.singleton(other)) ;
	}

	@Override
	public StreamModel minus(StreamModel other) {
		Map<CurveIdentifier, AnalysisRow> result = new HashMap<>();
		for (Map.Entry<CurveIdentifier, AnalysisRow> e : map.entrySet()) {
			AnalysisRow row = other.getAnalysisRow(e.getKey());
			if (row != null) {
				row = DefaultAnalyisRow.minus(e.getValue(), row);
			}
			result.put(e.getKey(), row);
		}

		return new StreamModelImpl(analysisPeriod, result);
	}

}
