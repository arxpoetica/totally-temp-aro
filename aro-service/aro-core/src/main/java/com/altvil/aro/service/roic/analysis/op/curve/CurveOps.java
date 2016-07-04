package com.altvil.aro.service.roic.analysis.op.curve;

import com.altvil.aro.service.roic.analysis.builder.Aggregator;
import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.model.RoicAnalysis;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;

public interface CurveOps {

	StreamModel minus(StreamModel lhs, StreamModel rhs);

	RoicNetworkModel minus(RoicNetworkModel lhs, RoicNetworkModel rhs);

	RoicComponent minus(RoicComponent lhs, RoicComponent rhs);

	<M extends RoicAnalysis> Aggregator<?, M> sum(Class<M> clz);

}
