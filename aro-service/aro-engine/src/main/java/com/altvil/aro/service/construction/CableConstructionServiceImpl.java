package com.altvil.aro.service.construction;

import java.util.Date;

import com.altvil.aro.service.graph.segment.CableConstruction;
import com.altvil.interfaces.CableConstructionEnum;

public class CableConstructionServiceImpl implements  CableConstructionService  {

	@Override
	public CableConstructionPricing createCableConstructionPricing(
			String state, Date date, double ratioBurried) {
		// TODO Auto-generated method stub
		return null;
	}
	
	
	private class CableConstructionPricingImpl implements CableConstructionPricing {

		@Override
		public CableConstruction getDefaultCableConstruction() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		public CableConstruction price(CableConstructionEnum constructionType) {
			// TODO Auto-generated method stub
			return null;
		}
		
	}

	
	
}
