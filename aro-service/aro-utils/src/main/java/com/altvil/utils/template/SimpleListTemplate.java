package com.altvil.utils.template;

import java.util.Collection;
import java.util.Iterator;

public class SimpleListTemplate extends SimpleTemplate {

	private String separator = ",";
	
	public SimpleListTemplate(String template) {
		super(template);
	}
	
	public SimpleListTemplate(String template, String separator) {
		this(template);
		this.separator = separator;
	}	

	@Override
	public <T> TemplateBuilder replaceRepeat(String key, Collection<T> models, final TemplateBuilder template, final Mapper<T> mapper) {
				
		if (separator == null) {
			super.replaceRepeat(key, models, template, mapper);
		}
		else
		{
			StringBuilder sb = new StringBuilder() ;

			Iterator<T> m = models.iterator();

			while(m.hasNext()) {
				TemplateBuilder t = template.newTemplate() ;
				if( mapper.map(m.next(), t) ) {
					sb.append(t.getResult());
					if (m.hasNext()) {
						sb.append(separator);
					}
				}
			}

			this.replace(key, sb.toString()) ;
		}
		
		return this;
		
	}

}
