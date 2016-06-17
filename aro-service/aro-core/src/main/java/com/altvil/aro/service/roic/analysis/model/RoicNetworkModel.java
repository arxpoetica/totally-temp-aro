package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.op.Transformer;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.roic.model.NetworkType;

public interface RoicNetworkModel extends RoicAnalysis {

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

	
	public AnalysisPeriod getAnalysisPeriod() ;
	


	RoicComponent getNetworkCurves();
	Collection<RoicComponent> getRoicComponents() ;
	
	Collection<RoicNetworkModel> getBaseModels();

	NetworkAnalysisType getNetworkAnalysisType();

	AnalysisRow getAnalysisRow(ComponentType type, CurveIdentifier id);

	AnalysisRow getAnalysisRow(CurveIdentifier id);
	

	RoicComponent getEntityAnalysis(ComponentType type);

	Transformer<RoicNetworkModel> add(NetworkAnalysisType type);

	RoicNetworkModel minus(RoicNetworkModel other);

}
