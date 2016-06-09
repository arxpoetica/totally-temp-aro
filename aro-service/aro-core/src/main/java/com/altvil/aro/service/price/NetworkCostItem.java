package com.altvil.aro.service.price;

import java.util.Collection;

import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.optimize.model.EquipmentAssignment;

public class NetworkCostItem {

	private EquipmentAssignment aroEntity ; //Implied Tree Structure (via graph mapping)
	
	//private networkCode ; --> Meta Type
	private MaterialType materialType ;
	
	private double quantity ;
	private double price;
	
	//Explicit Tree Structure
	private Collection<NetworkCostItem> childItems ;

}
