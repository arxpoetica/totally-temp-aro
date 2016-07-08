DROP TABLE IF EXISTS "financial"."line_item_type";
create table financial.line_item_type (
	"id" serial PRIMARY KEY,
	"name" varchar(32) UNIQUE,
	"description" varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE financial.line_item_type OWNER TO "aro";

insert into financial.line_item_type (name, description) 
	values('cost','Cost') ;

insert into financial.line_item_type (name, description) 
	values('irr','Internal Rate Return') ;

insert into financial.line_item_type (name, description) 
	values('npv','Net Present Value') ;

insert into financial.line_item_type (name, description) 
	values('household.count','Household Count') ;

insert into financial.line_item_type (name, description) 
	values('household.fairshare','Household Fairshare') ;

insert into financial.line_item_type (name, description) 
	values('celltower.count','Celltower Count') ;

insert into financial.line_item_type (name, description) 
	values('celltower.fairshare','Celltower Fairshare') ;

insert into financial.line_item_type (name, description) 
	values('small_business.count','Small Business Count') ;

insert into financial.line_item_type (name, description) 
	values('small_business.fairshare','Small Business Fairshare') ;

insert into financial.line_item_type (name, description) 
	values('medium_business.count','Medium Business Count') ;

insert into financial.line_item_type (name, description) 
	values('medium_business.fairshare','Medium Business Fairshare') ;

insert into financial.line_item_type (name, description) 
	values('large_business.count','Large Business Count') ;

insert into financial.line_item_type (name, description) 
	values('large.fairshare','Large Business Fairshare') ;

insert into financial.line_item_type (name, description) 
	values('atomic_count','Atomic Count') ;

insert into financial.line_item_type (name, description) 
	values('incremental.revenue','Incremental Revenue') ;

