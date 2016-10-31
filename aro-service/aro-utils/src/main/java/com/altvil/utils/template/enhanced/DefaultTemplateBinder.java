package com.altvil.utils.template.enhanced;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DefaultTemplateBinder  implements TemplateBinder {
	
	private TemplateInfo template ;
	private List<String> idList ;
	
	
	private Map<String, String> ctx = new HashMap<String, String>() ;
	
	private int count = 0 ;
	private int slotCount = 0 ;
	
	
	public DefaultTemplateBinder(TemplateInfo template) {
		super();
		this.template = template;
		this.idList = template.getIdList() ;
	}

	@Override
	public TemplateBinder bind(int slotIndex, String value) {
		return bind(idList.get(slotIndex), value) ;
	}

	@Override
	public TemplateBinder bind(String value) {
		return bind(slotCount++, value) ;
	}

	@Override
	public TemplateBinder bind(String id, String value) {
		ctx.put(id, value) ;
		count++ ;
		return this;
	}	

	@Override
	public String resolve() throws TemplateException {
		
		if( count != idList.size() ) {
			throw new TemplateException("Invalid args passed to template ") ;
		}
		
		StringBuilder sb = new StringBuilder() ;
		template.assemble(ctx, sb) ;
		return sb.toString() ;
	}	

}
