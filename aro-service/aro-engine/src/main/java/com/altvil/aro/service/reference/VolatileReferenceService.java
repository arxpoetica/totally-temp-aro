package com.altvil.aro.service.reference;

import java.util.Collection;
import java.util.function.Supplier;

import com.altvil.utils.reference.VolatileReference;

public interface VolatileReferenceService {

	Collection<VolatileState> getVolatileStates();
	
	VolatileState getVolatileState(ReferenceType reference) ;

	void invalidate(ReferenceType reference);

	<T> VolatileReference<T> createVolatileReference(ReferenceType type,
			Supplier<T> supplier);
	
	<T> VolatileReference<T> createVolatileReference(ReferenceType type,
			Supplier<T> supplier, long timeMillis);

}
