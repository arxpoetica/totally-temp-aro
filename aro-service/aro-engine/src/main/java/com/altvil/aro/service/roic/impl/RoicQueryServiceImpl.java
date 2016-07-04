package com.altvil.aro.service.roic.impl;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.RoicQueryService;
import com.altvil.aro.service.roic.RoicService;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.curve.DefaultAnalyisRow;
import com.altvil.aro.service.roic.analysis.model.curve.RowReference;
import com.altvil.aro.service.roic.analysis.model.impl.DefaultRowReference;
import com.altvil.aro.service.roic.analysis.registry.impl.ScopedCurveIdentifier;

@Service
public class RoicQueryServiceImpl implements RoicQueryService {

	private RoicService roicService;

	@Autowired
	public RoicQueryServiceImpl(RoicService roicService) {
		super();
		this.roicService = roicService;
	}

	private RowReference toEmptyReference(String name, int period) {
		return new DefaultRowReference(new ScopedCurveIdentifier(name),
				new DefaultAnalyisRow(new double[period]));
	}

	@Override
	public Collection<RowReference> queryRoic(Long planId,
			Collection<String> curveNames) {
		RoicModel model = roicService.getRoicModel(planId);

		if (model == null) {
			return curveNames.stream().map(id -> toEmptyReference(id, 15))
					.collect(Collectors.toList());
		}

		return curveNames.stream().map(id -> model.getRowReference(id))
				.collect(Collectors.toList());
	}

	@Override
	public Collection<RowReference> queryRoicAll(Long planId) {
		RoicModel model = roicService.getRoicModel(planId);
		return model.getCurvePaths().stream()
				.map(id -> model.getRowReference(id))
				.collect(Collectors.toList());
	}

}
