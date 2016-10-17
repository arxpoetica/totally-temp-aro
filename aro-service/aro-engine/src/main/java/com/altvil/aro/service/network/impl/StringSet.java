package com.altvil.aro.service.network.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;

import com.altvil.aro.service.cu.cache.query.FingerprintWriter;
import com.altvil.aro.service.cu.cache.query.Fingerprintable;

@SuppressWarnings("serial")
public class StringSet extends HashSet<String> implements Fingerprintable {

	@Override
	public void appendFingerprint(FingerprintWriter writer) {
		List<String> list = new ArrayList<>(this) ;
		Collections.sort(list);
		for(String s : list) {
			writer.append(s);
		}
		
	}
	
	

}
