const fs = require("fs");
const path = require("path");

function jsonToCsv(jsonData) {
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new Error("Input must be a non-empty array of objects");
  }

  // Get headers from the first object
  const headers = Object.keys(jsonData[0]);

  // Create CSV content
  const csvContent = [
    // Headers row
    headers.join(","),
    // Data rows
    ...jsonData.map((row) =>
      headers.map((header) => {
        const value = row[header] || "";
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    ),
  ].join("\n");

  return csvContent;
}

function convertJsonFileToCsv(inputJsonFile, outputCsvFile = null) {
  try {
    // Read JSON file
    const jsonContent = fs.readFileSync(inputJsonFile, "utf8");
    const jsonData = JSON.parse(jsonContent);

    // Convert to CSV
    const csvContent = jsonToCsv(jsonData);

    // Generate output filename if not provided
    if (!outputCsvFile) {
      const baseName = path.basename(inputJsonFile, ".json");
      const dirName = path.dirname(inputJsonFile);
      outputCsvFile = path.join(dirName, `${baseName}.csv`);
    }

    // Write CSV file
    fs.writeFileSync(outputCsvFile, csvContent, "utf8");

    console.log(`Successfully converted ${inputJsonFile} to ${outputCsvFile}`);
    console.log(`Converted ${jsonData.length} records`);

    return outputCsvFile;
  } catch (error) {
    console.error("Error converting JSON to CSV:", error.message);
    throw error;
  }
}

// Command line usage
function main() {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile) {
    console.error("Usage: node json-to-csv.js <input.json> [output.csv]");
    console.error("Examples:");
    console.error("  node json-to-csv.js shopify-reviews-2025-09-20-123456.json");
    console.error("  node json-to-csv.js input.json output.csv");
    process.exit(1);
  }

  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file '${inputFile}' not found`);
    process.exit(1);
  }

  try {
    convertJsonFileToCsv(inputFile, outputFile);
  } catch (error) {
    process.exit(1);
  }
}

// Export functions for use as module
module.exports = {
  jsonToCsv,
  convertJsonFileToCsv,
};

// Run main if called directly
if (require.main === module) {
  main();
}