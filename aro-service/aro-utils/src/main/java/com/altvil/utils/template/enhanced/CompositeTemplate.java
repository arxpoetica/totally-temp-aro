package com.altvil.utils.template.enhanced;

import java.util.List;
import java.util.Map;

public class CompositeTemplate extends AbstractTemplate {

	private List<TemplateInfo> templates;
	

	public CompositeTemplate(List<String> idList, List<TemplateInfo> templates) {
		super(idList);
		this.templates = templates;
	}

	@Override
	public void assemble(Map<String, String> map, StringBuilder sb) {
		for (TemplateInfo t : templates) {
			t.assemble(map, sb);
		}
	}
	

}