package com.altvil.utils.template.enhanced;

public interface TemplateBinder {
	

	public TemplateBinder bind(String value) ;

	public TemplateBinder bind(String id, String value);

	public TemplateBinder bind(int slotIndex, String value);

	public String resolve() throws TemplateException  ;

}
