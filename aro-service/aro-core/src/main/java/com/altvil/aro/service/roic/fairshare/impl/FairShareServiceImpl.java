package com.altvil.aro.service.roic.fairshare.impl;

import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.FairShareModel.ModelType;
import com.altvil.aro.service.roic.fairshare.FairShareModelTypeEnum;
import com.altvil.aro.service.roic.fairshare.FairShareService;
import com.altvil.aro.service.roic.fairshare.spi.FairShareModelFactory;

@Service
public class FairShareServiceImpl implements FairShareService {
	
	private static final Logger log = LoggerFactory
			.getLogger(FairShareServiceImpl.class.getName());

	
	private Map<ModelType, FairShareModelFactory> modelFactoryMap = new HashMap<>() ;
	private Map<String, ModelType> modelTypeMap = new HashMap<>();
	
	private String[] factories = new String[]{
			"com.altvil.aro.service.roic.fairshare.impl.DefaultFairShareModel",
			"com.altvil.aro.service.roic.fairshare.impl.SimpleFairShareModelFactory",
			"com.altvil.aro.service.roic.fairshare.impl.StrangeFairShareModelFactory"} ;
	
	@PostConstruct
	private void init() {
		
		//TODO Read this out of config and assemble Factories;
		for(String s : factories) {
			try {
				FairShareModelFactory factory = createFairShareModelFactory(s) ;
				ModelType type = factory.getModelType() ;
				modelFactoryMap.put(type, factory) ;
				modelTypeMap.put(type.getName(), type) ;
			} catch( Throwable err ) {
				log.error(err.getMessage(), err);
			}
		}
			
	}
	
	private FairShareModelFactory createFairShareModelFactory(String clzName) throws Exception {
		return FairShareModelFactory.class.cast(Class.forName(clzName).newInstance()) ;
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
