package com.altvil.aro.service.roic.analysis;

import java.util.Collection;

import com.altvil.aro.service.roic.product.Product;

public interface ProductAnalysis {
	
	Collection<Product> getProducts() ;
	RowReference getProductPenetration(Product product);
	RowReference getProductRevenue(Product product) ;
	RowReference getTotalCashFlows() ; 
	
	//double 
	double getDiscountedCashFlows(double discountRate) ;
	
}
