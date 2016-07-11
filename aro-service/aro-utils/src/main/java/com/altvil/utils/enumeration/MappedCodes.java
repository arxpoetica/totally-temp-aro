package com.altvil.utils.enumeration;

import java.util.Set;

public interface MappedCodes<S, D> {

	public Set<S> getSourceCodes() ;
	
	public S getSource(D domain);

	public D getDomain(S code);

}