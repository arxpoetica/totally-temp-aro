package com.altvil.aro.service.roic.analysis.registry;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public class DefaultContainerRegistry extends AbstractCurveRegistry implements
		CurveRegistry {

	private Map<String, CurveRegistry> map = new HashMap<>();

	public DefaultContainerRegistry(String nameSpace) {
		super(nameSpace);
	}

	@Override
	public CurveRegistry getCurveRegistry(CurvePath path) {
		return map.get(path);
	}
	
	@Override
	public Collection<CurveRegistry> getCurveRegestries() {
		return map.values() ;
	}

	public void add(CurveRegistry cr) {
		map.put(cr.getNameSpace(), cr);
	}

	public void add(Collection<? extends CurveRegistry> subContainers) {
		subContainers.forEach(this::add);
	}

}
