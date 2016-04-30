package com.altvil.aro.service.roic.fairshare;

import com.altvil.aro.service.roic.fairshare.FairShareModel.ModelType;


public interface FairShareService {
	
	ModelType getModelType(String name) ;
	FairShareModel createModel(ModelType modelType, FairShareInputs inputs) ;
	

}
