package com.altvil.utils.template;

import java.util.Collection;

public class SimpleTemplate implements TemplateBuilder {

	private String template;
	private String result;

	public SimpleTemplate(String template) {
		super();
		this.template = template;
		this.result = template;
	}

	public SimpleTemplate replace(String key, String val) {
		val = (val == null) ? "" : val;
		result = replace(result, "${" + key + "}", val);

		return this;
	}

	public String getResult() {
		return result;
	}

	@Override
	public TemplateBuilder newTemplate() {
		return new SimpleTemplate(template);
	}

	@Override
	public <T> TemplateBuilder replaceRepeat(String key, Collection<T> models,
			TemplateBuilder template, Mapper<T> mapper) {

		StringBuilder sb = new StringBuilder();

		for (T m : models) {
			TemplateBuilder t = template.newTemplate();
			if (mapper.map(m, t)) {
				sb.append(t.getResult());
			}
		}

		this.replace(key, sb.toString());

		return this;
	}

	private static String replace(String template, String key, String value) {

		StringBuffer sb = new StringBuffer(template.length());

		int lastIndex = 0;
		int i = template.indexOf(key, lastIndex);

		while (lastIndex < template.length() && i > -1) {
			sb.append(template.substring(lastIndex, i));
			sb.append(value);

			lastIndex = i + key.length();
			i = template.indexOf(key, lastIndex);
		}

		if (lastIndex < template.length()) {
			sb.append(template.substring(lastIndex, template.length()));
		}

		return sb.toString();

	}
}
