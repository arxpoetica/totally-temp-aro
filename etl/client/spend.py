import pandas as pd

def import_spend(db, spend_data):
    spend_data.loc[:,'spend'].fillna(value = 0, 
                                     inplace = True)
    
    spend_data['monthly_spend'] = spend_data.loc[:,'spend'] / 12
    
    spend_data = create_normalized_table(db, spend_data, 
                                         ['product_type', 'product'], 
                                         add_products, get_products, 
                                         ['product_type', 'product'], 
                                         ['product_type', 'product_name'], 
                                         'product_id')
        
    spend_data = create_normalized_table(db, spend_data, 
                                         ['industry_name'], 
                                         add_industries, get_industries, 
                                         ['industry_name'], 
                                         ['industry_name'], 
                                         'industry_id')
    
    spend_data = create_normalized_table(db, spend_data, 
                                         ['employees_at_location_range'], 
                                         add_employees_by_location, 
                                         get_employees_by_location, 
                                         ['employees_at_location_range'], 
                                         ['value_range'], 
                                         'employees_by_location_id')
    
    add_spend(db, spend_data)
    
def import_industry_mapping(db, industry_mapping):
    industries = get_industries(db)
    
    industry_mapping = industry_mapping.merge(industries, 
                                              how = 'left', 
                                              left_on = ['industry_name'], 
                                              right_on = ['industry_name'])

    industry_mapping.loc[:,'id'] = industry_mapping.loc[:,'id'].astype(int)
    add_industry_mapping(db, industry_mapping.loc[:,['id', 'sic4']])

def create_normalized_table(db, spend_data, cols_to_normalize, 
                            create_func, get_func,
                            spend_merge_cols, table_merge_cols, 
                            id_colname):
    
    data = spend_data.loc[:, cols_to_normalize].drop_duplicates()
    
    create_func(db, data)
    info = get_func(db)
    
    spend_data = spend_data.merge(info, 
                                  left_on = spend_merge_cols,
                                  right_on = table_merge_cols, 
                                  how = 'left')
    
    spend_data.rename(columns = {'id': id_colname}, 
                      inplace = True)
    
    return spend_data

def add_industry_mapping(db, industry_mapping):
    print "Adding industry mapping..."
    cur = db.cursor()
    
    values = industry_mapping.to_dict('split')['data']

    sql_query = """INSERT INTO client.industry_mapping (industry_id, sic4)
                    VALUES (%s, %s);
                """
    
    cur.executemany(sql_query, values)
    cur.close()
    
    db.commit()
    
def delete_industry_mapping(db):
    print "Deleting industry mapping..."
    cur = db.cursor()
    
    sql_query = """DELETE FROM client.industry_mapping;
                """
                
    cur.execute(sql_query)
    cur.close()
    
    db.commit()

def replace_misc_phrases(emp_str):
    print emp_str
    terms_to_replace = [' Emp', 'Very Small ', 'Small ', 'Medium ', 
                        'Large ', '+']
    
    for t in terms_to_replace:
        emp_str = emp_str.replace(t, '')
    print emp_str
    return emp_str

def add_employees_by_location(db, loc_sizes):
    print "Adding employee information..."
    
    split = [replace_misc_phrases(x).split('-') 
             for x in loc_sizes.loc[:,'employees_at_location_range']]
    
    min_ranges = [int(x[0].strip()) for x in split]
    max_ranges = [int(x[1].strip()) for x in split if len(x) > 1]
    max_ranges.append(1000000)
    
    loc_sizes.loc[:,'min_value'] = min_ranges
    loc_sizes.loc[:,'max_value'] = max_ranges
    
    cur = db.cursor()
    
    values = loc_sizes.to_dict('split')['data']

    sql_query = """INSERT INTO client.employees_by_location (value_range, 
                                                             min_value, 
                                                             max_value)
                    VALUES (%s, %s, %s);
                """
    
    cur.executemany(sql_query, values)
    cur.close()
    
    db.commit()

def get_employees_by_location(db, frame = True):
    cur = db.cursor()
    
    sql_query = """SELECT * FROM client.employees_by_location;"""
    
    cur.execute(sql_query)
    res = cur.fetchall()
    
    if frame:
        colnames = [desc[0] for desc in cur.description]
        df = pd.DataFrame(res, columns = colnames)
        cur.close()
        return df
    else:
        cur.close()
        return res

def add_industries(db, industries):
    print "Adding industry information..."
    cur = db.cursor()
    
    values = industries.to_dict('split')['data']

    sql_query = """INSERT INTO client.industries (industry_name)
                    VALUES (%s);
                """
    
    cur.executemany(sql_query, values)
    cur.close()

    db.commit()
    
def get_industries(db, frame = True):
    cur = db.cursor()
    
    sql_query = """SELECT * FROM client.industries;"""
    
    cur.execute(sql_query)
    res = cur.fetchall()
    
    if frame:
        colnames = [desc[0] for desc in cur.description]
        df = pd.DataFrame(res, columns = colnames)
        cur.close()
        return df
    else:
        cur.close()
        return res
    
def add_products(db, products):
    print "Adding client product data..."
    cur = db.cursor()
    
    values = products.to_dict('split')['data']

    sql_query = """INSERT INTO client.products (product_type,
                                                product_name)
                    VALUES (%s, %s);
                """
    
    cur.executemany(sql_query, values)
    cur.close()

    db.commit()
    
def get_products(db, frame = True):
    cur = db.cursor()
    
    sql_query = """SELECT * FROM client.products;"""
    
    cur.execute(sql_query)
    res = cur.fetchall()
    
    if frame:
        colnames = [desc[0] for desc in cur.description]
        df = pd.DataFrame(res, columns = colnames)
        cur.close()
        return df
    else:
        cur.close()
        return res
    
def add_spend(db, spend):
    print "Adding client spend data..."
    colnames = ['product_id', 
                'industry_id', 
                'employees_by_location_id', 
                'year', 
                'monthly_spend', 
                'currency']
    
    spend = spend.loc[:,colnames]
    
    cur = db.cursor()
    
    values = spend.to_dict('split')['data']

    sql_query = """INSERT INTO client.spend (product_id,
                                             industry_id, 
                                             employees_by_location_id, 
                                             year, 
                                             monthly_spend, 
                                             currency_abbrev)
                    VALUES (%s, %s, %s, %s, %s, %s);
                """
    
    cur.executemany(sql_query, values)
    cur.close()

    db.commit()

def delete_spend(db):
    sql_query = """DELETE FROM client.spend;
                """
    
    cur = db.cursor()
    
    cur.execute(sql_query)
    cur.close()
    
    db.commit()
        
def delete_industry_mapping(db):
    sql_query = """DROP TABLE client.industry_mapping CASCADE;
                """
    
    cur = db.cursor()
    
    cur.execute(sql_query)
    
def delete_industries(db):
    sql_query = """DELETE FROM client.industries;
                """
    
    cur = db.cursor()
    
    cur.execute(sql_query)
    cur.close()

    db.commit()

def delete_products(db):
    sql_query = """DELETE FROM client.products;
                """
    
    cur = db.cursor()
    
    cur.execute(sql_query)
    cur.close()

    db.commit()

def delete_emps_by_location(db):
    sql_query = """DELETE FROM client.employees_by_location;
                """
    
    cur = db.cursor()
    
    cur.execute(sql_query)
    cur.close()

    db.commit()

    cur.close()

    db.commit()