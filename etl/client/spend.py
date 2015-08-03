import pandas as pd

def import_spend(db, spend_data):
    products = spend_data.loc[:, ['product_type', 
                                  'product']].drop_duplicates()
                                  
    add_product(db, products)
    
    spend_data['monthly_spend'] = spend_data.loc[:,'spend'] / 12
    
    product_info = get_products(db)
    spend_data = spend_data.merge(product_info, 
                                  left_on = ['product_type', 'product'], 
                                  right_on = ['product_type', 'product_name'], 
                                  how = 'left')
    spend_data.drop(['product_type', 
                     'product_name', 
                     'spend'], 
                    axis = 1, 
                    inplace = True)
    
    spend_data.rename(columns = {'id': 'product_id'}, 
                      inplace = True)

    add_spend(db, spend_data)
    
def add_product(db, products):
    print "Adding client product data..."
    cur = db.cursor()
    
    values = products.to_dict('split')['data']

    sql_query = """INSERT INTO client.products (product_type,
                                                product_name)
                    VALUES (%s, %s);
                """
    
    cur.executemany(sql_query, values)
    
    db.commit()
    
def get_products(db, frame = True):
    cur = db.cursor()
    
    sql_query = """SELECT * FROM client.products;"""
    
    cur.execute(sql_query)
    res = cur.fetchall()
    
    if frame:
        colnames = [desc[0] for desc in cur.description]
        df = pd.DataFrame(res, columns = colnames)
        return df
    else:
        return res
    
def add_spend(db, spend):
    print "Adding client spend data..."
    colnames = ['product_id', 
                'industry_name', 
                'employees_at_location_range', 
                'year', 
                'monthly_spend']
    
    spend = spend.loc[:,colnames]
    
    cur = db.cursor()
    
    values = spend.to_dict('split')['data']

    sql_query = """INSERT INTO client.spend (product_id,
                                             industry_name, 
                                             employees_at_location, 
                                             year, 
                                             monthly_spend)
                    VALUES (%s, %s, %s, %s, %s);
                """
    
    # list of tuples with 2 entries each
    cur.executemany(sql_query, values)
    
    db.commit()