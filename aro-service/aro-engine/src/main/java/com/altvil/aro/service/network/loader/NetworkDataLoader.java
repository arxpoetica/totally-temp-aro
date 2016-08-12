package com.altvil.aro.service.network.loader;

import com.altvil.aro.service.network.model.LocationData;
import com.altvil.aro.service.network.model.NetworkEquipmentData;
import com.altvil.aro.service.network.model.ServiceData;

public interface NetworkDataLoader {
	
	ServiceData loadServiceData(int wireCenter) ;
	LocationData loadLocationData(int wireCenter, int year) ;
	NetworkEquipmentData loadNetworkEquipmentData(int planId) ;
	

}
