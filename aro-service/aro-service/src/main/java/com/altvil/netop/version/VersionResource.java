package com.altvil.netop.version;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VersionResource {

	@RequestMapping(value = "/version", method = RequestMethod.GET, produces = {"application/json"})
	public @ResponseBody VersionInfo getVersion() {
		return new VersionInfo();
	}
	
}
