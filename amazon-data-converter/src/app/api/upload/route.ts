import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "fs";
import * as fs from "fs";
import { promises as fsPromises } from "fs";
import * as path from "path";
import { createWorker } from "tesseract.js";
import * as ExcelJS from "exceljs";

// Disable body parsing, Next.js handles formData automatically
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// Main handler for file upload
export async function POST(req: NextRequest) {
  try {
    // Use req.formData() to get form data
    const formData = await req.formData();
    // Get the file from formData (assuming input field name is 'file')
    const file = formData.get('file') as File | null;

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: "No file uploaded or invalid file data" }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "uploads");
    try {
      await fsPromises.mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error("Error creating upload directory:", error);
      return NextResponse.json({ error: "Failed to create upload directory" }, { status: 500 });
    }

    // Convert file to buffer and save it
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, file.name);
    await fsPromises.writeFile(filePath, buffer);

    // Prepare file info for processing
    const fileInfo = {
      path: filePath,
      name: file.name,
      type: file.type,
    };

    // Start processing in the background
    processFile(fileInfo).catch(console.error);

    // Redirect to processing page
    return NextResponse.redirect(new URL("/processing", req.url));
  } catch (error: any) { // Keep basic error handling
    console.error("Error handling upload:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}

// Background processing function
async function processFile(fileInfo: { path: string; name: string; type: string }) {
  try {
    // Step 1: OCR processing (if needed)
    let extractedText = "";
    let structuredData: any[] = [];

    if (fileInfo.type.includes("image") || fileInfo.type.includes("pdf")) {
      // For images and PDFs, use OCR
      const worker = await createWorker();
      const result = await worker.recognize(fileInfo.path);
      extractedText = result.data.text;
      await worker.terminate();

      // Basic structure extraction from text
      structuredData = extractTextToStructuredData(extractedText);
    } else if (fileInfo.type.includes("spreadsheet") || fileInfo.path.endsWith(".xlsx") || fileInfo.path.endsWith(".xls")) {
      // For Excel files, read directly
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(fileInfo.path);
      structuredData = extractExcelToStructuredData(workbook);
    } else {
      // For other file types, try to read as text
      const content = await fsPromises.readFile(fileInfo.path, "utf-8");
      extractedText = content;
      structuredData = extractTextToStructuredData(extractedText);
    }

    // Step 2: Structure the data
    // (Already done in the previous step)

    // Step 3: Match to Amazon format and validate
    const amazonFormattedData = matchToAmazonFormat(structuredData);

    // Step 4: Generate Excel file
    const outputPath = await generateAmazonExcel(amazonFormattedData);

    // Store the output path for download
    // In a real app, you'd store this in a database or session
    await fsPromises.writeFile(
      path.join(process.cwd(), "uploads", "output_path.txt"),
      outputPath,
      "utf-8"
    );

    return outputPath;
  } catch (error) {
    console.error("Error processing file:", error);
    throw error;
  }
}

// Helper function to extract structured data from text
function extractTextToStructuredData(text: string): any[] {
  // This is a simplified implementation
  // In a real app, you'd use more sophisticated NLP techniques
  const lines = text.split("\n").filter(line => line.trim());
  const products: any[] = [];

  let currentProduct: any = {};
  for (const line of lines) {
    if (line.includes("商品名") || line.includes("Product Name")) {
      if (Object.keys(currentProduct).length > 0) {
        products.push(currentProduct);
        currentProduct = {};
      }
      currentProduct.name = line.split(":")[1]?.trim() || "";
    } else if (line.includes("価格") || line.includes("Price")) {
      currentProduct.price = line.split(":")[1]?.trim() || "";
    } else if (line.includes("説明") || line.includes("Description")) {
      currentProduct.description = line.split(":")[1]?.trim() || "";
    } else if (line.includes("SKU") || line.includes("商品コード")) {
      currentProduct.sku = line.split(":")[1]?.trim() || "";
    } else if (line.includes("カテゴリ") || line.includes("Category")) {
      currentProduct.category = line.split(":")[1]?.trim() || "";
    } else if (currentProduct.description) {
      // Append to description if it's a continuation
      currentProduct.description += " " + line.trim();
    }
  }

  if (Object.keys(currentProduct).length > 0) {
    products.push(currentProduct);
  }

  return products;
}

// Helper function to extract structured data from Excel
function extractExcelToStructuredData(workbook: ExcelJS.Workbook): any[] {
  const products: any[] = [];
  const worksheet = workbook.getWorksheet(1); // Get the first worksheet

  if (!worksheet) {
    return products;
  }

  // Try to detect headers
  const headers: { [key: string]: number } = {};
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    const value = cell.value?.toString().toLowerCase() || "";
    if (value.includes("商品名") || value.includes("product") || value.includes("name")) {
      headers.name = colNumber;
    } else if (value.includes("価格") || value.includes("price")) {
      headers.price = colNumber;
    } else if (value.includes("説明") || value.includes("description")) {
      headers.description = colNumber;
    } else if (value.includes("sku") || value.includes("商品コード") || value.includes("code")) {
      headers.sku = colNumber;
    } else if (value.includes("カテゴリ") || value.includes("category")) {
      headers.category = colNumber;
    }
  });

  // If no headers detected, make a best guess
  if (Object.keys(headers).length === 0) {
    headers.name = 1;
    headers.price = 2;
    headers.description = 3;
    headers.sku = 4;
    headers.category = 5;
  }

  // Extract data from rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row

    const product: any = {};
    if (headers.name) product.name = row.getCell(headers.name).value?.toString() || "";
    if (headers.price) product.price = row.getCell(headers.price).value?.toString() || "";
    if (headers.description) product.description = row.getCell(headers.description).value?.toString() || "";
    if (headers.sku) product.sku = row.getCell(headers.sku).value?.toString() || "";
    if (headers.category) product.category = row.getCell(headers.category).value?.toString() || "";

    if (product.name || product.sku) {
      products.push(product);
    }
  });

  return products;
}

// Helper function to match data to Amazon format
function matchToAmazonFormat(products: any[]): any[] {
  // This is a simplified implementation
  // In a real app, you'd use a predefined mapping and validation rules
  return products.map(product => {
    // Generate a random confidence score for category matching (for demo purposes)
    const categoryConfidence = Math.random();
    const needsReview = categoryConfidence < 0.95;

    // Check for potential policy violations (simplified)
    const hasPolicyViolation = product.description && (
      product.description.includes("最高") ||
      product.description.includes("最良") ||
      product.description.includes("最速") ||
      product.description.includes("No.1")
    );

    return {
      ...product,
      // Map to Amazon's format (simplified)
      item_sku: product.sku || `SKU-${Math.floor(Math.random() * 10000)}`,
      item_name: product.name,
      product_description: product.description,
      standard_price: product.price,
      main_image_url: "",
      category: product.category || "ペット用品",
      // Metadata for UI highlighting
      _metadata: {
        categoryConfidence,
        needsReview,
        hasPolicyViolation,
      }
    };
  });
}

// Helper function to generate Amazon Excel file
async function generateAmazonExcel(products: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Products");

  // Define columns based on Amazon's template
  worksheet.columns = [
    { header: "item_sku", key: "item_sku", width: 20 },
    { header: "item_name", key: "item_name", width: 40 },
    { header: "product_description", key: "product_description", width: 60 },
    { header: "standard_price", key: "standard_price", width: 15 },
    { header: "main_image_url", key: "main_image_url", width: 30 },
    { header: "category", key: "category", width: 20 },
  ];

  // Add header row with styling
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD3D3D3" },
  };

  // Add data rows
  products.forEach((product, index) => {
    const row = worksheet.addRow({
      item_sku: product.item_sku,
      item_name: product.item_name,
      product_description: product.product_description,
      standard_price: product.standard_price,
      main_image_url: product.main_image_url,
      category: product.category,
    });

    // Apply highlighting for items that need review
    if (product._metadata.needsReview) {
      const cell = row.getCell(6); // Category column
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF9999" }, // Light red
      };
    }

    // Apply highlighting for policy violations
    if (product._metadata.hasPolicyViolation) {
      const cell = row.getCell(3); // Description column
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFCC99" }, // Light orange
      };
    }
  });

  // Save the workbook
  const outputPath = path.join(process.cwd(), "uploads", "amazon_formatted.xlsx");
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}
