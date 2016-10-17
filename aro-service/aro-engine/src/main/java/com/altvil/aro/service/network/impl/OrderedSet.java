package com.altvil.aro.service.network.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;

import com.altvil.aro.service.cu.cache.query.FingerprintWriter;
import com.altvil.aro.service.cu.cache.query.Fingerprintable;


public class OrderedSet<T extends Comparable<T>>  extends HashSet<T> implements Fingerprintable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	
	

	public OrderedSet() {
		super();
	}
	

	public OrderedSet(Collection<? extends T> c) {
		super(c);
	}




	@Override
	public void appendFingerprint(FingerprintWriter writer) {
		List<T> list = new ArrayList<>(this) ;
		Collections.sort(list);
		for(T s : list) {
			writer.append(s.toString());
		}
		
	}

}
