package com.altvil.aro.service.roic.analysis.model.impl;

import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.ComponentModel;

public class ComponentModelImpl implements ComponentModel {

	private EntityAnalysisType type;
	private StreamModel streamModel;

	public ComponentModelImpl(EntityAnalysisType type, StreamModel streamModel) {
		super();
		this.type = type;
		this.streamModel = streamModel;
	}

	@Override
	public StreamModel getStreamModel() {
		return streamModel;
	}

	@Override
	public EntityAnalysisType getAnalysisType() {
		return type;
	}

	@Override
	public AnalysisRow getAnalysisRow(CurveIdentifier id) {
		return streamModel.getAnalysisRow(id);
	}

	@Override
	public ComponentModel add(ComponentModel other) {
		return new ComponentModelImpl(type, streamModel.add(other
				.getStreamModel()));
	}

	@Override
	public ComponentModel minus(ComponentModel other) {
		return new ComponentModelImpl(type, streamModel.minus(other
				.getStreamModel()));
	}

}
