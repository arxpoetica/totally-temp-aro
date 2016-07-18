package com.altvil.utils.reflexive;

import java.util.Set;
import java.util.function.Function;

public interface MappedCodes<S, D> {

	Set<S> getSourceCodes();

	S getSource(D domain);

	D getDomain(S code);

	
	MappedCodes<D, S> flip() ;
	
	<T> MappedCodes<T, D> reindexSource(Function<S, T> f);

	<T> MappedCodes<S, T> reindexDomain(Function<D, T> f);

}