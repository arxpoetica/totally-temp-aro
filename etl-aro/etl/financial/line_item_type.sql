DROP TABLE IF EXISTS "financial"."line_item_type";
create table financial.line_item_type (
	"id" serial PRIMARY KEY,
	"name" varchar(32) UNIQUE,
	"description" varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE financial.line_item_type OWNER TO "aro";


insert into financial.line_item_type (name, description) 
	values('irr','Internal Rate Return') ;

insert into financial.line_item_type (name, description) 
	values('npv','Net Present Value') ;

