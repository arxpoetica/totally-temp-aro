-- COST_CODE_TYPE (LABOR | MATERIAL)
DROP TABLE IF EXISTS financial.cost_code_type;
CREATE TABLE "financial"."cost_code_type" (
	"id" serial PRIMARY KEY,
	"name" varchar(32) UNIQUE,
	"description" varchar(256)
)
WITH (OIDS=FALSE);
ALTER TABLE "financial"."cost_code_type" OWNER TO "aro";

insert into financial.cost_code_type (name, description) values ('labor', 'Labor') ;
insert into financial.cost_code_type (name, description) values ('material', 'Material') ;
	insert into financial.cost_code_type (name, description) values ('construction', 'Construction') ;