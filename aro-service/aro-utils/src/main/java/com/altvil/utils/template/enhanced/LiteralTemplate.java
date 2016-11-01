package com.altvil.utils.template.enhanced;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class LiteralTemplate extends AbstractTemplate {

	private static final List<String> EMPTY = new ArrayList<String>(0);

	private String literal;

	public LiteralTemplate(String literal) {
		super(EMPTY);
		this.literal = literal;
	}

	@Override
	protected List<String> constructIdList() {
		return EMPTY;
	}

	@Override
	public void assemble(Map<String, String> map, StringBuilder sb) {
		sb.append(literal);
	}

}
