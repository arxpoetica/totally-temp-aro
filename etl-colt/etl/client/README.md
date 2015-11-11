# Spend data

## Background
The relevant data is in the TSM sheet within the `2015 11 05_Spend Matrix France_vSENT.xlsx` and `2015 11 05_Spend Matrix Germany_vSENT.xlsx` files. This data represents the yearly spend per business. 

### Creating a spend dataset
Importing the spend data from this Excel workbook will very little manipulation of the data in Excel. The data required for the import process is a csv file with the following columns: 
- location
- product	
- sub_product	
- infousa_industry	
- infousa_size	

and a column for each year for which there is data. 

The product column is blank in the Excel workbook - this is intentional and will be adjusted in the code.

Spend should be the spend per business for the entire calendar year. The ETL script will divide this value by 12 to get a monthly spend value. You do not need to do this before importing the data.

Steps to convert (for each city for which there is spend data): 

	1. Create a new column called “location”. Enter values in the format `<city_name>,<country_name>`.
	2. Save the resulting file with a name that includes the phrase `reformatted_spend`. The file must be in csv format.
	3. Place the resulting files in the `etl/client/spend_data` directory.

#### ETL

 - `make reset_client`: Drops all client-related objects.
 - `make etl_client`: One of the commands executed with this command is the reload of all data stored in the `reformatted_spend.csv` file.
 
### Script Overview
 
First, the ETL script `spend.py` replaces missing values in the spend data with zeros and divides the values in the "spend" column by 12 to get a monthly spend value. The script creates a product type column. It also reshapes the data so that the year to which the spend values apply is a column. The script creates mapping tables for products (using `product_type` and `product` columns), industries (using the `industry_name` column), and employees (using the `employees_at_location_range` column). The script merges the IDs generated for these mapping tables with the original data using the pandas merge function, and imports the reformatted DataFrame to the spend table.
 
  

