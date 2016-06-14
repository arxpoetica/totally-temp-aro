package com.altvil.aro.service.roic.analysis;

import com.altvil.aro.service.roic.model.NetworkType;

import java.util.Collection;

public interface FullNetworkAnalysis {
	
	Collection<StreamAnalysis> getAnalysis(NetworkType type) ;

}
