package com.altvil.netop.data;

import java.util.Collection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.model.AdministrativeOperatingCompany;
import com.altvil.aro.service.model.Edge;
import com.altvil.aro.service.model.ModelService;
import com.altvil.aro.service.model.WireCenter;

@RestController
public class ModelEndPoint {

	@Autowired
	private ModelService modelService;

	@RequestMapping(value = "/model/aoc", method = RequestMethod.GET)
	public @ResponseBody Collection<AdministrativeOperatingCompany> administrativeOperatingCompanies() {
		return modelService.allAdministrativeOperatingCompanies();
	}

	@RequestMapping(value = "/model/wirecenters/{aocn}", method = RequestMethod.GET)
	public @ResponseBody Collection<WireCenter> wireCenters(@PathVariable("aocn") String aocn) {
		return modelService.wireCenters(aocn);
	}

	@RequestMapping(value = "/model/edges/{wireCenter}", method = RequestMethod.GET)
	public @ResponseBody Collection<Edge> edgesInWireCenter(@PathVariable("wireCenter") String wireCenter) {
		return modelService.edgesInWireCenter(wireCenter);
	}
}
