package com.altvil.aro.service.price;

public class PricingContext {
	
	public static PricingContext create(ConstructionRatios constructionRatios) {
		PricingContext pc = new PricingContext() ;
		pc.setConstructionRatios(constructionRatios);
		return pc ;
	}
	
	private ConstructionRatios constructionRatios = ConstructionRatios.DEFAULT ;

	public ConstructionRatios getConstructionRatios() {
		return constructionRatios;
	}

	public void setConstructionRatios(ConstructionRatios constructionRatios) {
		this.constructionRatios = constructionRatios;
	}
	
	

}
