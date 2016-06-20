package com.altvil.aro.service.roic.analysis.model.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.RowReference;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.analysis.model.builder.DefaultRowReference;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.registry.CurvePath;
import com.altvil.aro.service.roic.analysis.registry.CurveRegistry;
import com.altvil.aro.service.roic.analysis.registry.impl.DefaultContainerRegistry;
import com.altvil.aro.service.roic.analysis.registry.impl.ScopedCurveIdentifier;

public class RoicModelImpl extends DefaultContainerRegistry implements
		RoicModel {

	private AnalysisPeriod analysisPeriod;
	private Map<NetworkAnalysisType, RoicNetworkModel> map;

	private Map<String, AnalysisRow> rowMap = null;

	public RoicModelImpl(AnalysisPeriod analysisPeriod,
			Map<NetworkAnalysisType, RoicNetworkModel> map) {
		super("roic");
		this.analysisPeriod = analysisPeriod;
		this.map = map;

		add(map.values());
	}

	public AnalysisPeriod getAnalysisPeriod() {
		return analysisPeriod;
	}

	@Override
	public RoicNetworkModel getRoicNetworkModel(NetworkAnalysisType type) {
		return map.get(type);
	}
	
	

	@Override
	public Collection<String> getCurvePaths() {
		return getRowMap().keySet() ;
	}

	@Override
	public AnalysisRow getAnalysisRow(String curveName) {
		AnalysisRow ar =  getRowMap().get(curveName) ;
		if( ar == null ) {
			throw new RuntimeException("Unknown curve name : " + curveName) ;
		}
		
		return ar ;
	
	}
	

	@Override
	public RowReference getRowReference(String path) {
		return new DefaultRowReference(new ScopedCurveIdentifier(path), getAnalysisRow(path)) ;
	}

	private Map<String, AnalysisRow> getRowMap() {
		if (rowMap == null) {
			rowMap = assembleRows() ;
		}
		
		return rowMap ;
	}
	
	private  Map<String, AnalysisRow> assembleRows() {
		 Map<String, AnalysisRow>  result = new HashMap<>() ;
		 assemble("", result, this);
		 return result ;
	}

	private static class LeafPath implements CurvePath {

		private CurveIdentifier id;

		public LeafPath setCurveIdentifier(CurveIdentifier id) {
			this.id = id;
			return this;
		}

		@Override
		public boolean isLastElement() {
			return true;
		}

		@Override
		public String nextElement() {
			return id.toString();
		}

		@Override
		public CurveIdentifier nextCurveIdentifier() {
			return id;
		}

		@Override
		public boolean isEmpty() {
			return false;
		}

	}

	private void assemble(String path, Map<String, AnalysisRow> map,
			CurveRegistry cr) {

		LeafPath p = new LeafPath();

		for (CurveIdentifier id : cr.getCurveIdentifiers()) {

			map.put(path + id.toString(),
					cr.getAnalysisRow(p.setCurveIdentifier(id)));
		}
		for (CurveRegistry r : cr.getCurveRegestries()) {
			assemble(path + r.getNameSpace() + ".", map, r);
		}
	}

}
