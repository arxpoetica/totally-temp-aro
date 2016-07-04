package com.altvil.aro.service.roic.analysis.op.curve;

import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;

import com.altvil.aro.service.roic.analysis.calc.StreamModel;
import com.altvil.aro.service.roic.analysis.calc.impl.StreamModelImpl;
import com.altvil.aro.service.roic.analysis.model.RoicComponent;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.curve.DefaultAnalyisRow;
import com.altvil.aro.service.roic.analysis.model.impl.ComponentModelImpl;
import com.altvil.aro.service.roic.analysis.model.impl.RoicNetworkModelImpl;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class CurveOp {

	public static RoicNetworkModel minus(RoicNetworkModel lhs,
			RoicNetworkModel rhs) {
		Map<ComponentType, RoicComponent> result = new EnumMap<>(
				ComponentType.class);

		result.put(
				ComponentType.network,
				minus(lhs.getRoicComponent(ComponentType.network),
						rhs.getRoicComponent(ComponentType.network)));

		return new RoicNetworkModelImpl(NetworkAnalysisType.incremental,
				lhs.getAnalysisPeriod(), result);
	}

	public static RoicComponent minus(RoicComponent lhs, RoicComponent rhs) {
		return new ComponentModelImpl(lhs.getAnalysisPeriod(),
				lhs.getComponentType(), minus(lhs.getStreamModel(),
						rhs.getStreamModel()));
	}
	

	private static StreamModel minus(StreamModel lhs, StreamModel rhs) {
		Map<CurveIdentifier, AnalysisRow> result = new HashMap<>();
		for (CurveIdentifier id : lhs.getCurveIdentifiers()) {
			AnalysisRow lhsRow = lhs.getAnalysisRow(id);
			AnalysisRow rhsRow = rhs.getAnalysisRow(id);
			if (rhsRow != null) {
				lhsRow = DefaultAnalyisRow.minus(lhsRow, rhsRow);
			}
			result.put(id, lhsRow);
		}

		return new StreamModelImpl(lhs.getAnalysisPeriod(), result);
	}




}
