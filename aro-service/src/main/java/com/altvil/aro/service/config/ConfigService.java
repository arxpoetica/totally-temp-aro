package com.altvil.aro.service.config;

import java.util.Collection;
import java.util.Properties;

public interface ConfigService {

	/**
	 * 
	 * @return
	 */
	public Properties getProperties();

	/**
	 * 
	 * @param key
	 * @param defaultValue
	 * @return
	 */
	public String getProperty(String key, String defaultValue);

	/**
	 * 
	 * @param key
	 * @return
	 */
	public Collection<String> getStringList(String key);
	
	/**
	 * 
	 * @return
	 */
	public String getVersion() ;

}
