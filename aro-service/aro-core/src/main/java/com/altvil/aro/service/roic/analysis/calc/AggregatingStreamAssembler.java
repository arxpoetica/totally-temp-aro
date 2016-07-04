package com.altvil.aro.service.roic.analysis.calc;

import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public interface AggregatingStreamAssembler extends StreamAssembler {

	public AggregatingStreamAssembler add(CurveIdentifier... ids);

}
