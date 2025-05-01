import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import * as path from "path";

export async function GET(req: NextRequest) {
  try {
    // In a real app, you'd get the file path from a database or session
    // For simplicity, we're reading it from a file
    const outputPathFile = path.join(process.cwd(), "uploads", "output_path.txt");
    
    try {
      const outputPath = await fs.readFile(outputPathFile, "utf-8");
      
      // Check if the file exists
      try {
        await fs.access(outputPath);
      } catch (error) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      
      // Read the file
      const fileBuffer = await fs.readFile(outputPath);
      
      // Create a response with the file
      const response = new NextResponse(fileBuffer);
      
      // Set headers
      response.headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      response.headers.set("Content-Disposition", `attachment; filename="amazon_formatted.xlsx"`);
      
      return response;
    } catch (error) {
      console.error("Error reading output path:", error);
      return NextResponse.redirect(new URL("/", req.url));
    }
  } catch (error) {
    console.error("Error handling download:", error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
