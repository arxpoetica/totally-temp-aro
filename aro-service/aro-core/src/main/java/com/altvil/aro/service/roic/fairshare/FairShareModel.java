package com.altvil.aro.service.roic.fairshare;

import java.util.Set;

import com.altvil.aro.service.roic.model.NetworkType;

public interface FairShareModel {
	
	public interface ModelType {
		String getName() ;
	}
	
	public ModelType getModelType() ;
	
	Set<NetworkType> getNetworkTypes() ;
	double getTotalShare() ;
	double getShare(NetworkType type) ;

}
