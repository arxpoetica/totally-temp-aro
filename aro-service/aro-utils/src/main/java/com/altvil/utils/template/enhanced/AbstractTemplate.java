package  com.altvil.utils.template.enhanced;

import java.util.ArrayList;
import java.util.List;

public abstract class AbstractTemplate implements TemplateInfo {

	private static final List<String> EMPTY = new ArrayList<String>(0) ;
	private List<String> idList;

	public AbstractTemplate( List<String> idList) {
		super();
		this.idList = idList ;
	}
	
	public AbstractTemplate() {
		this(null) ;
	}

	protected List<String> constructIdList(){
		return EMPTY ;
	}

	@Override
	public int getIdCount() {
		return getIdList().size();
	}

	@Override
	public List<String> getIdList() {

		if (idList == null) {
			idList = constructIdList();
		}

		return idList;
	}

	@Override
	public TemplateBinder createTemplateBinder() {
		return new DefaultTemplateBinder(this);
	}

}
