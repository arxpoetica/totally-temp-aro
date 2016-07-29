package com.altvil.aro.service.construction;

import java.util.Date;


public interface CableConstructionService {
	
	CableConstructionPricing createCableConstructionPricing(String state, Date date, double ratioBurried) ;

}
