package com.altvil.utils.template;

import java.util.Collection;

public interface TemplateBuilder {
	
	public TemplateBuilder replace(String key, String value) ;
	public <T> TemplateBuilder replaceRepeat(String key, Collection<T> models, TemplateBuilder template, Mapper<T> mapper) ;
	public String getResult() ;
	public TemplateBuilder newTemplate() ;
	
}
