package com.altvil.aro.service.roic.fairshare;

import com.altvil.aro.service.roic.fairshare.FairShareModel.ModelType;


//TODO move to config
public enum FairShareModelTypeEnum implements ModelType {
	
	StandardModel("StandardModel"),
	SimpleModel("SimpleModel"),
	AltvilModel("AltVilModel")
	
	;

	private String name ;
	private FairShareModelTypeEnum(String name) {
		this.name = name ;
	}
	
	@Override
	public String getName() {
		return name ;
	}

	
}
