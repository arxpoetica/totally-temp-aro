package com.altvil.aro.service.roic.impl;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.RoicQueryService;
import com.altvil.aro.service.roic.RoicService;
import com.altvil.aro.service.roic.analysis.RowReference;
import com.altvil.aro.service.roic.analysis.model.RoicModel;

@Service
public class RoicQueryServiceImpl implements RoicQueryService {

	private RoicService roicService;
	
	@Autowired
	public RoicQueryServiceImpl(RoicService roicService) {
		super();
		this.roicService = roicService;
	}


	@Override
	public Collection<RowReference> queryRoic(Long planId,
			Collection<String> curveNames) {
		RoicModel model = roicService.getRoicModel(planId);
		return curveNames.stream().map(id -> model.getRowReference(id))
				.collect(Collectors.toList());
	}

}
