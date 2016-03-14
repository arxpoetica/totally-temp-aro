package com.altvil.aro.service.graph.transform.ftp;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import com.altvil.aro.service.entity.DropCable;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.UnitUtils;

public class DropCableModel {
	
	
	public static DropCableModel create(Collection<DropCable> dropCables) {
		return new DropCableModel(dropCables) ;
	}
	
	public static DropCableModel createDropCableModel(Collection<Double> lengths) {
		return create(StreamUtil.map(lengths, DropCable::new)) ;
	}
	
	public static DropCableModel createDropCableModel(double length, double ... lengths) {
		List<Double> result = new ArrayList<>() ;
		result.add(length) ;
		for(double l : lengths) {
			result.add(l) ;
		}
		return createDropCableModel(result) ;
	}
	
	public static DropCableModel DEFAULT_MODEL = 
			createDropCableModel(
					UnitUtils.toMeters(50),
					UnitUtils.toMeters(100),
					UnitUtils.toMeters(150),
					UnitUtils.toMeters(500),
					UnitUtils.toMeters(1000),
					UnitUtils.toMeters(1500)) ;
	
	private List<DropCable> dropCables ;
	private Double[] dropLengths;
	
	private DropCableModel(Collection<DropCable> dropCables) {
		init(dropCables) ;
	}
	
	private void init(Collection<DropCable> undorderedCables) {
		dropCables = new ArrayList<>(undorderedCables) ;
		Collections.sort(dropCables) ;
		
		dropLengths = new Double[dropCables.size()] ;
		int i = 0 ;
		for(DropCable dc : dropCables) {
			dropLengths[i++] = dc.getLength() ;
 		}
		
	}
	
	public Collection<DropCable> getDropCableTypes() {
		return dropCables  ;
	}
	
	public DropCable getDropCable(double length) {
		int index = Arrays.binarySearch(dropLengths, length) ;
		
		if( index < 0 ) {
			index = Math.min((index * -1) + 1,dropLengths.length)  ;
		}
		
		return dropCables.get(index) ;
	}

}
