package com.altvil.netop.reference;

import java.util.Collection;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.reference.ReferenceType;
import com.altvil.aro.service.reference.VolatileReferenceService;
import com.altvil.aro.service.reference.VolatileState;

@RestController
public class CacheReferenceEndPoint {

	@Autowired
	private VolatileReferenceService volatileReferenceService ;
	
	@RequestMapping(value = "/ref-cache", method = RequestMethod.GET)
	public @ResponseBody Collection<VolatileState> getVolatileStateCollection() {
		return volatileReferenceService.getVolatileStates() ;
	}
	
	@RequestMapping(value = "/ref-cache/{id}", method = RequestMethod.GET)
	public @ResponseBody VolatileState getCacheState(@PathVariable("id") String refType) {
		return volatileReferenceService.getVolatileState(ReferenceType.valueOf(refType)) ;
	}
	
	@RequestMapping(value = "/ref-cache/{id}", method = RequestMethod.DELETE)
	public @ResponseBody void invalidateCacheState(@PathVariable("id") String refType) {
		 volatileReferenceService.invalidate(ReferenceType.valueOf(refType)) ;
	}
	
}
