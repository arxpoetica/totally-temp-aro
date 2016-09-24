package com.altvil.aro.service.network;

import java.io.Serializable;
import java.util.Collection;

public class ServiceAreaContext implements Serializable {

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

}
