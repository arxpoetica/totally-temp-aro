package com.altvil.utils;

import java.util.Arrays;
import java.util.List;

import com.altvil.utils.template.SimpleTemplate;

public class RuleGenerator {

	private List<String> states = Arrays.asList(new String[] { "CA", "TX" });

	private static String template = "CREATE RULE r_${SRC_SCHEMA}_${PARENT_TBL}_${STATE_LOWER} AS ON INSERT TO t WHERE (state = '${STATE}')\n"
			+ "    DO INSTEAD INSERT INTO ${PARTITION_TBL}_${STATE_LOWER} VALUES (NEW.*);";

	public String process(String srcSchema, String srcName, String targetName) {
		StringBuffer sb = new StringBuffer();
		for (String state : states) {
			String lowerCaseState = state.toLowerCase();
			sb.append(new SimpleTemplate(template)
					.replace("SRC_SCHEMA", srcSchema)
					.replace("PARENT_TBL", srcName)
					.replace("PARTITION_TBL", targetName)
					.replace("STATE", state).replace("STATE_LOWER", lowerCaseState)
					.getResult());
			sb.append("\n");
		}
		return sb.toString();
	}

	public static void main(String[] args) {

		System.out.println(new RuleGenerator().process("aro", "location",
				"aro_data.location"));

	}

}
