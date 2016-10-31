package com.altvil.utils.template.enhanced;

import java.util.ArrayList;
import java.util.List;

public class TemplateFactory {
	public static final TemplateFactory FACTORY = new TemplateFactory();

	private interface TemplateBuilder {
		public void addLiteral(String literal);

		public void addId(String literal);

		public Template resolve();
	}

	private Template createTemplate(String s, IdFragmentScanner scanner)
			throws TemplateException {
		return new Lexer(s, scanner).scan(new DefaultTemplateBuilder())
				.resolve();
	}

	public Template createRestTemplate(String urlFragment)
			throws TemplateException {
		return createTemplate(urlFragment, new RestIdFragmentScanner());
	}

	private static class DefaultTemplateBuilder implements TemplateBuilder {
		private List<TemplateInfo> templates = new ArrayList<TemplateInfo>();
		private List<String> ids = new ArrayList<String>() ;

		@Override
		public void addId(String id) {
			ids.add(id) ;
			templates.add(new ParamTemplate(id));
		}

		@Override
		public void addLiteral(String literal) {
			templates.add(new LiteralTemplate(literal));
		}

		public Template resolve() {
			return templates.size() == 1 ? templates.get(0)
					: new CompositeTemplate(ids, templates);
		}

	}

	private interface IdFragmentScanner {
		public boolean scanIdFragment(String s, int index)
				throws TemplateException;

		public int getStartIndex();

		public String getId();

		public int getEndIndex();
	}

	private static class RestIdFragmentScanner implements IdFragmentScanner {

		private String id;
		private int startIndex;
		private int endIndex;

		@Override
		public boolean scanIdFragment(String s, int index)
				throws TemplateException {
			this.startIndex = s.indexOf('{', index); // scan for startToken
			if (startIndex < 0) {
				return false;
			}

			this.endIndex = s.indexOf('}', index + 1);
			if (endIndex < 0) {
				throw new TemplateException(
						"Id reference not terminated at position " + index);
			}

			this.id = s.substring(startIndex + 1, endIndex);

			return true;
		}

		@Override
		public int getStartIndex() {
			return startIndex;
		}

		@Override
		public String getId() {
			return id;
		}

		@Override
		public int getEndIndex() {
			return endIndex;
		}

	}

	private static class Lexer {

		private String source;
		private IdFragmentScanner scanner;

		public Lexer(String source, IdFragmentScanner scanner) {
			super();
			this.source = source;
			this.scanner = scanner;
		}

		public TemplateBuilder scan(TemplateBuilder builder)
				throws TemplateException {

			int index = 0;

			while (index < source.length()) {
				if (scanner.scanIdFragment(source, index)) {
					if (scanner.getStartIndex() > index) { // Emit literal
						builder.addLiteral(source.substring(index, scanner
								.getStartIndex()));
					}
					builder.addId(scanner.getId()); // Emit Id
					index = scanner.getEndIndex() + 1;
				} else {
					builder
							.addLiteral(source
									.substring(index, source.length())); // Emit
					// Final
					// literal
					index = source.length();
				}
			}

			return builder;
		}
	}

	public static void main(String[] args) {
		try {
			Template s = FACTORY.createRestTemplate("x/{id1}/z") ;
			System.out.println(s.createTemplateBinder().bind("a").resolve());
			
			s = FACTORY.createRestTemplate("x/{id1}/{id2}");
			System.out.println(s.createTemplateBinder().bind("a").bind("b").resolve()) ;

			s = FACTORY.createRestTemplate("{id1}/{id}/{id3}");
			System.out.println(s.createTemplateBinder().bind("a").bind("b").bind("c").resolve()) ;

			s = FACTORY.createRestTemplate("{id1}");
			System.out.println(s.createTemplateBinder().bind("a").resolve()) ;

			s = FACTORY.createRestTemplate("a b c d");
			System.out.println(s.createTemplateBinder().resolve()) ;
			
			s = FACTORY.createRestTemplate("");
			System.out.println(s.createTemplateBinder().resolve()) ;

		} catch (Throwable err) {
			err.printStackTrace();
		}
	}

}
