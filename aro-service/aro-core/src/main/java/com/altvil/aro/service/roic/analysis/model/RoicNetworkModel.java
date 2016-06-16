package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.registry.CurveRegistry;
import com.altvil.aro.service.roic.model.NetworkType;

public interface RoicNetworkModel extends CurveRegistry {

	public enum NetworkAnalysisType {
		undefined(NetworkType.Undefined), bau(NetworkType.Copper), planned(
				NetworkType.Mixed), incremental(NetworkType.Mixed), copper(
				NetworkType.Copper), fiber(NetworkType.Fiber), copper_intersects(
				NetworkType.Copper), copper_remaining(NetworkType.Copper)

		;

		private NetworkType networkType;

		private NetworkAnalysisType(NetworkType type) {
			this.networkType = type;
		}

		public NetworkType getNetworkType() {
			return networkType;
		}

	}

	/*
	 * 
	 * bau -> copper planned -> fiber count copper flipped ratio
	 * 
	 * incremental
	 */

	public interface Transformer {
		Transformer setType(NetworkAnalysisType type);

		Transformer setModel(RoicNetworkModel model);

		Transformer addModel(RoicNetworkModel model);

		Transformer setCurveIds(Collection<CurveIdentifier> ids);

		RoicNetworkModel apply();
	}

	Collection<RoicNetworkModel> getBaseModels();

	NetworkAnalysisType getNetworkAnalysisType();

	AnalysisRow getAnalysisRow(ComponentType type, CurveIdentifier id);

	AnalysisRow getAnalysisRow(CurveIdentifier id);

	RoicComponent getNetworkCurves();

	RoicComponent getEntityAnalysis(ComponentType type);

	Transformer add();

	Transformer difference();

}
