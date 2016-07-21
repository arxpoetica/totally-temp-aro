package com.altvil.aro.service.roic.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.roic.model.NetworkType;

public interface RoicNetworkModel extends RoicAnalysis {

	public enum NetworkAnalysisType {
		undefined(NetworkType.Undefined), planned(
				NetworkType.Mixed), incremental(NetworkType.Mixed), copper(
				NetworkType.Copper), fiber(NetworkType.Fiber), copper_intersects(
				NetworkType.Copper), copper_remaining(NetworkType.Copper)

		;

		private NetworkType networkType;
		private boolean alias ;

		private NetworkAnalysisType(NetworkType type, boolean alias) {
			this.networkType = type;
		}
		
		private NetworkAnalysisType(NetworkType type) {
			this(type, false) ;
		}

		public NetworkType getNetworkType() {
			return networkType;
		}
		
		public boolean isAlias() {
			return alias ;
		}

	}

	
	public AnalysisPeriod getAnalysisPeriod() ;
	


	RoicComponent getRoicComponent(ComponentType ct) ;
	RoicComponent getNetworkCurves();
	
	

	Collection<RoicComponent> getRoicComponents() ;
	
	Collection<RoicNetworkModel> getBaseModels();

	NetworkAnalysisType getNetworkAnalysisType();

	AnalysisRow getAnalysisRow(ComponentType type, CurveIdentifier id);

	AnalysisRow getAnalysisRow(CurveIdentifier id);
	
	
	

	RoicComponent getEntityAnalysis(ComponentType type);


}
