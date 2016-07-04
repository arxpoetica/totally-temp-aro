package com.altvil.aro.service.roic.product;

import java.util.Set;

import com.altvil.aro.service.roic.model.NetworkType;

public interface ProductSet {
	
	NetworkType getNetworkType() ;
	
	Set<Product> getProducts() ;
	double getProductPercent(Product product) ;
	double getArpu(Product product) ;
	
}
