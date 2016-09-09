package com.altvil.aro.service.reference.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.altvil.aro.service.reference.ReferenceType;
import com.altvil.aro.service.reference.VolatileReferenceService;
import com.altvil.aro.service.reference.VolatileState;
import com.altvil.utils.reference.VolatileReference;

@Service
public class VolatileReferenceServiceImpl implements VolatileReferenceService {

	private Map<ReferenceType, VolatileReference<?>> map = Collections
			.synchronizedMap(new HashMap<>());

	@Override
	public Collection<VolatileState> getVolatileStates() {
		return getReferenceTypes().stream().map(this::getVolatileState)
				.collect(Collectors.toList());
	}

	@Override
	public VolatileState getVolatileState(ReferenceType reference) {
		VolatileState vs = new VolatileState();
		vs.setType(reference);
		vs.setInfo(map.get(reference).getVolatileReferenceInfo());
		return vs;
	}

	private Collection<ReferenceType> getReferenceTypes() {
		return new ArrayList<>(map.keySet());
	}

	@Override
	public void invalidate(ReferenceType reference) {
		VolatileReference<?> ref = map.get(reference);
		if (ref != null) {
			ref.get();
		}

	}

	@Override
	public <T> VolatileReference<T> createVolatileReference(ReferenceType type,
			Supplier<T> supplier, long timeMillis) {

		VolatileReference<T> ref = new VolatileReference<T>(supplier,
				timeMillis);
		map.put(type, ref);
		return ref;
	}

	@Override
	public <T> VolatileReference<T> createVolatileReference(ReferenceType type,
			Supplier<T> supplier) {
		return createVolatileReference(type, supplier, 1000L * 60L * 5L);
	}

}
