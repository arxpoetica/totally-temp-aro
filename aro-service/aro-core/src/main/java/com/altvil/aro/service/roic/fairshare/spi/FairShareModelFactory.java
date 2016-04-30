package com.altvil.aro.service.roic.fairshare.spi;

import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.FairShareModel;

public interface FairShareModelFactory {
	
	FairShareModel createModel(FairShareInputs inputs) ;

}
