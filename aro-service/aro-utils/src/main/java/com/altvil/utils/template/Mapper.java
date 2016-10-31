package com.altvil.utils.template;

public interface Mapper<T> {
	
	public boolean map(T model, TemplateBuilder template) ;

}
