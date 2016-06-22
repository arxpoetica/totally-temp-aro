package com.altvil.aro.service.roic.fairshare.spi;

import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.FairShareModel.ModelType;

public interface FairShareModelFactory {
	
	ModelType getModelType() ;
	FairShareModel createModel(FairShareInputs inputs) ;

}
