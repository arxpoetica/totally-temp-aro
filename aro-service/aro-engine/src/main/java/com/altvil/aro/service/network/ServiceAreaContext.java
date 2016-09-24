package com.altvil.aro.service.network;

import java.io.Serializable;
import java.util.Collection;

import com.altvil.aro.service.cu.cache.query.FingerprintWriter;
import com.altvil.aro.service.cu.cache.query.Fingerprintable;

public class ServiceAreaContext implements Serializable, Fingerprintable {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private Collection<String> stateCodes;
	private  Collection<String> fipsCodes = null ;
	
	public ServiceAreaContext(Collection<String> stateCodes,
			Collection<String> fipsCodes) {
		super();
		this.stateCodes = stateCodes;
		this.fipsCodes = fipsCodes;
	}

	public Collection<String> getStateCodes() {
		return stateCodes;
	}

	public Collection<String> getFipsCodes() {
		return fipsCodes;
	}

	@Override
	public void appendFingerprint(FingerprintWriter writer) {
		for(String s : stateCodes) {
			writer.append(s);
		}
	}
	
	

}
