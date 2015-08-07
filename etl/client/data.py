import psycopg2
import pandas as pd
import spend

def get_DBConn():
    try:
        db = psycopg2.connect(dbname = 'aro', 
                                user = 'aro', 
                                password  = 'aro',
                                host = 'localhost', 
                                port = 5432)
    except:
        print "Unable to connect"
        
    return db
   
def init(parser):
    subparser = parser.add_subparsers()

    spend_subparser = subparser.add_parser('spend').add_subparsers()
    
    _init_spend_csv_load(spend_subparser, 'values', 
                         add_spend, delete_spend)
    
    _init_spend_csv_load(spend_subparser, 'mapping',
                         add_industry_mapping, 
                         delete_industry_mapping)

def _init_spend_csv_load(subparser, subparser_name, add_func, delete_func):
    base = subparser.add_parser(subparser_name).add_subparsers()

    add_parser = base.add_parser('add')
    add_common_args(add_parser, default_func=add_func)
    add_parser.add_argument(
        'csv_file', type = str,
        help = 'path to CSV file to load')

    delete_parser = base.add_parser('delete')
    add_common_args(delete_parser, default_func=delete_func)
    
def add_common_args(parser, default_func=None):
    #this adds the standard args to our console commands
    if default_func is not None:
        parser.set_defaults(func=default_func)
    return parser

def add_spend(options):
    db = get_DBConn()
    df = pd.read_csv(options.csv_file)
    spend.import_spend(db, df)
    db.close()

def delete_spend(options):
    db = get_DBConn()
    spend.delete_spend(db)
    spend.delete_industries(db)
    spend.delete_products(db)
    spend.delete_emps_by_location(db)
    spend.delete_industry_mapping(db)
    db.close()
    
def add_industry_mapping(options):
    db = get_DBConn()
    industry_mapping = pd.read_csv(options.csv_file)
    spend.import_industry_mapping(db, industry_mapping)
    db.close()
 
def delete_industry_mapping(options):
    db = get_DBConn()
    spend.delete_industry_mapping(db)
    db.close()
