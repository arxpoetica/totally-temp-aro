package com.altvil.aro.service.roic.fairshare.impl;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.FairShareModelTypeEnum;
import com.altvil.aro.service.roic.fairshare.FairShareModel.ModelType;
import com.altvil.aro.service.roic.fairshare.FairShareService;
import com.altvil.aro.service.roic.fairshare.spi.FairShareModelFactory;

@Service
public class FairShareServiceImpl implements FairShareService {
	
	private Map<ModelType, FairShareModelFactory> modelFactoryMap = new HashMap<>() ;
	private Map<String, ModelType> modelTypeMap = new HashMap<>();
	
	@PostConstruct
	private void init() {
		
		//TODO Read this out of config and assemble Factories;
		
		for(FairShareModelTypeEnum t : FairShareModelTypeEnum.values()) {
			modelTypeMap.put(t.getName(), t) ;
		}
		
		modelFactoryMap.put(FairShareModelTypeEnum.StandardModel, new StandardFairShareModelFactory()) ;
		
	}
	
	@Override
	public ModelType getModelType(String name) {
		return modelTypeMap.get(name) ;
	}

	@Override
	public FairShareModel createModel(ModelType modelType,
			FairShareInputs inputs) {
		return modelFactoryMap.get(modelType).createModel(inputs) ;
	}	


}
