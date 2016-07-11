package com.altvil.utils.enumeration;

public interface MappedCodes<S, D> {

	public S getSource(D domain);

	public D getDomain(S code);

}