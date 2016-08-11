package com.altvil.aro.service.price;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.altvil.interfaces.CableConstructionEnum;

public class ConstructionRatios {
	
	public static final ConstructionRatios DEFAULT = createDefaults() ;

	private Collection<CableConstructionRatio> cableConstructionRatios;

	public static ConstructionRatios createDefaults() {
		List<CableConstructionRatio> ratios = new ArrayList<>() ;
		ratios.add(new CableConstructionRatio(CableConstructionEnum.ARIEL, 0.7)) ;
		ratios.add(new CableConstructionRatio(CableConstructionEnum.BURIED, 0.3)) ;
		ConstructionRatios constructionRatios = new ConstructionRatios() ;
		constructionRatios.setCableConstructionRations(ratios);
		return constructionRatios ;
	}
	
	public ConstructionRatios() {
		
	}
	
	
	public Collection<CableConstructionRatio> getCableConstructionRatios() {
		return cableConstructionRatios;
	}

	public void setCableConstructionRations(
			Collection<CableConstructionRatio> cableConstructionRatios) {
		this.cableConstructionRatios = cableConstructionRatios;
	}

}
