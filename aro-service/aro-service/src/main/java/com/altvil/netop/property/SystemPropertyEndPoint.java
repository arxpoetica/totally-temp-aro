package com.altvil.netop.property;

import java.util.Collection;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.altvil.aro.service.property.PropertyConfiguration;
import com.altvil.aro.service.property.SystemPropertyService;

@RestController
public class SystemPropertyEndPoint {

	public static class AroSystemProperty {
		private String name;
		private String value;

		public AroSystemProperty() {
		}

		public AroSystemProperty(String name, String value) {
			super();
			this.name = name;
			this.value = value;
		}

		public String getName() {
			return name;
		}

		public void setName(String name) {
			this.name = name;
		}

		public String getValue() {
			return value;
		}

		public void setValue(String value) {
			this.value = value;
		}
	}

	@Autowired
	private SystemPropertyService systemPropertyService;

	@RequestMapping(value = "system-property", method = RequestMethod.GET)
	public @ResponseBody Collection<AroSystemProperty> getSystemProperties() {

		PropertyConfiguration config = systemPropertyService.getConfiguration();

		return config
				.getSymbolReferences()
				.stream()
				.map(config::getSystemProperty)
				.map(p -> new AroSystemProperty(p.getSymbolRef().getName(), p
						.asString())).collect(Collectors.toList());

	}

}
