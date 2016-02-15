package com.altvil.aro.service.config.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.config.ConfigService;
import com.google.inject.Singleton;


@Singleton
public class ConfigServiceImpl implements ConfigService {

	private static final Logger log = LoggerFactory.getLogger(ConfigServiceImpl.class.getName());
	
	private static final String propFile = "conf/aro.properties";
	private Properties properties;

	public ConfigServiceImpl() {
		properties = loadProperties() ;
	}

	private Properties loadProperties() {
		
		Properties prop = new Properties() ;
		
		ClassLoader loader = ConfigServiceImpl.class.getClassLoader();
		if (loader == null)
			loader = ClassLoader.getSystemClassLoader();

		//TODO make more generic
		//file located at WEB-INF/classes/conf/
		java.net.URL url = loader.getResource(propFile);
		try {
			prop.load(url.openStream());
		} catch (Throwable e) {
			log.error("Could not load configuration file: " + propFile, e);
		}
		
		return prop ;
	}

	@Override
	public Properties getProperties() {
		return properties;
	}

	@Override
	public String getProperty(String key, String defaultValue) {
		return properties.getProperty(key, defaultValue);
	}

	@Override
	public Collection<String> getStringList(String key) {
		return parseList(properties.getProperty(key));
	}

	private Collection<String> parseList(String list) {
		if (list == null || list.length() == 0) {
			return new ArrayList<>(0);
		}

		List<String> result = new ArrayList<String>();
		for (String e : list.split(",")) {
			result.add(e.trim());
		}

		return result;
	}

	@Override
	public String getVersion() {
		return "0.1" ;
	}
	

}
