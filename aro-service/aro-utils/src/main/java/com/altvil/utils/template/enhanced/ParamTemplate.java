package com.altvil.utils.template.enhanced;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ParamTemplate extends AbstractTemplate {

	private String id;

	public ParamTemplate(String id) {
		super();
		this.id = id;
	}

	@Override
	protected List<String> constructIdList() {
		List<String> ids = new ArrayList<String>(1);
		ids.add(id);
		return ids;
	}

	@Override
	public void assemble(Map<String, String> map, StringBuilder sb) {
		String val = map.get(id);
		if (val == null) {
			sb.append("");
		} else {
			sb.append(val);
		}
	}

}
