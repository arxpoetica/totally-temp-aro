package com.altvil.utils;

import java.util.Arrays;
import java.util.List;

import com.altvil.utils.template.SimpleTemplate;

public class RuleGenerator {

	private List<String> states = Arrays.asList(new String[] { "WA" });

	private static String template = "CREATE RULE ${SRC_SCHEMA}_${PARENT_TBL}_${STATE_LOWER} AS ON INSERT TO ${SRC_SCHEMA}.${PARENT_TBL} WHERE (state = '${STATE}')\n"
			+ "    DO INSTEAD INSERT INTO ${PARTITION_TBL}_${STATE_LOWER} VALUES (NEW.*);";

	
	
	public String locationRule() {
		return process("aro", "locations",
				"aro_location_data.locations") ;
	}
	
	public String towerRule() {
		return process("aro", "towers",
				"aro_location_data.towers") ;
	}

	public String process(String srcSchema, String srcName, String targetName) {
		StringBuilder sb = new StringBuilder();
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

		System.out.println(new RuleGenerator().towerRule());

	}

}
