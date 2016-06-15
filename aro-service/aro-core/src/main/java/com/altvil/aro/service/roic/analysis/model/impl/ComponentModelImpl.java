package com.altvil.aro.service.roic.analysis.model.impl;

import java.util.Collection;

import javax.naming.OperationNotSupportedException;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;

public class ComponentModelImpl implements RoicComponent {

	private AnalysisPeriod analysisPeriod ;
	private ComponentType type;
	private StreamModel streamModel;

	public ComponentModelImpl(AnalysisPeriod analysisPeriod, ComponentType type, StreamModel streamModel) {
		super();
		this.type = type;
		this.streamModel = streamModel;
	}

	@Override
	public StreamModel getStreamModel() {
		return streamModel;
	}

	@Override
	public ComponentType getComponentType() {
		return type;
	}

	@Override
	public AnalysisRow getAnalysisRow(CurveIdentifier id) {
		return streamModel.getAnalysisRow(id);
	}

	@Override
	public AnalysisPeriod getAnalysisPeriod() {
		return analysisPeriod ;
	}

	@Override
	public RoicComponent add(RoicComponent other) {
		return new ComponentModelImpl(analysisPeriod, type, streamModel.add(other
				.getStreamModel()));
	}

	@Override
	public RoicComponent minus(RoicComponent other) {
		return new ComponentModelImpl(analysisPeriod, type, streamModel.minus(other
				.getStreamModel()));
	}

	@Override
	public RoicComponent add(Collection<RoicComponent> other) {
		throw new RuntimeException("Implement me now") ;
	}
	
	

}
