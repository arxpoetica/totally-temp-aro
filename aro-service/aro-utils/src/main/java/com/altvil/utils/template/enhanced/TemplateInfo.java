package com.altvil.utils.template.enhanced;

import java.util.List;
import java.util.Map;

public interface TemplateInfo extends Template {

	public List<String> getIdList();

	public void assemble(Map<String, String> map, StringBuilder sb);

	public int getIdCount();

}
