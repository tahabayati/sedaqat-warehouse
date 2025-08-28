# 🚀 Complete Solution - Single Script Usage Guide

## 📋 What This Script Does

The `complete_solution.py` script is a **single, comprehensive solution** that:

1. **📥 Reads** your source invoice file (`.xls`, `.xlsx`)
2. **🔍 Automatically detects** the product table structure
3. **📊 Extracts** all invoice data including header information
4. **📋 Populates** the Excel template with real data
5. **💾 Saves** the final populated Excel file

## 🎯 Perfect for Your Use Case

**Input Files:**

- `1.xls` - Your source invoice (SpreadsheetML format)
- `مصرف کننده.xlsm` - The Excel template you want to populate

**Output:**

- `result.xlsx` - Fully populated Excel file ready for use

## 🚀 Quick Start

### Basic Usage (Recommended)

```bash
python3 complete_solution.py --source 1.xls --template "مصرف کننده.xlsm" --output result.xlsx
```

### Advanced Usage Options

```bash
# Specify a specific sheet
python3 complete_solution.py --source 1.xls --template "مصرف کننده.xlsm" --output result.xlsx --sheet-name "Page1"

# Specify a custom header row
python3 complete_solution.py --source 1.xls --template "مصرف کننده.xlsm" --output result.xlsx --header-row 27

# Use different file names
python3 complete_solution.py --source invoice.xls --template template.xlsm --output final.xlsx
```

## 📊 What Gets Extracted Automatically

### ✅ **Header Information (Real Data):**

- **تاریخ صدور فاکتور**: `1404/05/09` (Invoice Issue Date)
- **شماره فاکتور اصلی**: `A11R9D04F4C00000004E73` (Main Invoice Number)
- **نام خریدار**: `اعظمي` (Buyer Name)
- **شماره سریال**: `240` (Serial Number)
- **سریال فاکتور حافظه مالیاتی**: `1255` (Tax Memory Serial)

### ✅ **Product Data:**

- **شناسه کالا** (Product IDs)
- **تعداد/مقدار** (Quantities)
- **مبلغ واحد** (Unit Prices)
- **مبلغ تخفیف** (Discounts)
- **مبلغ مالیات و عوارض** (Taxes & Duties)

### ✅ **Financial Summary:**

- **Total Amount**: 1,904,689,995 ریال
- **Total Tax**: 173,153,633 ریال
- **Total Discount**: 484,918,182 ریال

## 🔧 Requirements

Make sure you have the required packages installed:

```bash
pip install pandas openpyxl xlrd
```

## 📁 File Structure

```
sedaqat.co/data/
├── complete_solution.py          # 🎯 THE SINGLE SCRIPT YOU NEED
├── 1.xls                        # Your source invoice
├── مصرف کننده.xlsm              # Your Excel template
└── result.xlsx                  # Output (will be created)
```

## 🎉 Benefits of This Single Script

1. **🚀 One Command**: Everything in a single script call
2. **🔍 Auto-Detection**: Automatically finds product tables and headers
3. **📊 Real Data**: Uses actual invoice data instead of defaults
4. **📋 Complete Mapping**: Maps all available fields to the template
5. **💾 Ready Output**: Produces Excel files ready for official use
6. **🔄 Reusable**: Works with any similar invoice files

## 🆘 Troubleshooting

### Common Issues:

1. **File Not Found**: Check file paths and names
2. **Permission Error**: Make sure Excel template isn't open
3. **Empty Output**: Verify source file contains data

### Debug Mode:

```bash
python3 -v complete_solution.py --source 1.xls --template "مصرف کننده.xlsm" --output debug.xlsx
```

## 📝 Example Output

When you run the script, you'll see:

```
🚀 Starting complete workflow...
==================================================
📋 Step 1: Loading and extracting invoice data...
✅ Sheet loaded: Page1
📊 Data shape: (45, 63)

🔍 Step 2: Detecting product table header...
✅ Auto-detected header row: 27

📊 Step 3: Extracting invoice data...
✅ Extracted 7 product items
✅ Extracted 14 metadata fields

📋 Step 4: Populating Excel template...
✅ Excel template populated successfully

📋 Step 5: Generating summary report...
[Detailed report with all extracted data]

🎉 Complete workflow finished successfully!
📁 Final output: result.xlsx

✅ Workflow completed successfully!
```

## 🎯 Perfect Solution for Your Needs

This single script gives you **exactly what you asked for**:

- ✅ Takes 2 Excel files as input
- ✅ Produces the populated result
- ✅ Everything in one command
- ✅ No need to run multiple scripts
- ✅ Professional-grade output ready for use

**Just run one command and you're done!** 🎉
