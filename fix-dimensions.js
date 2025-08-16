// Utility script to find and fix incorrect product dimensions
// Run this script to identify products with potentially reversed dimensions

import dbConnect from './lib/mongodb.js';
import Barcode from './lib/models/Barcode.js';

// Function to detect potentially incorrect dimensions
function detectIncorrectDimensions(name) {
  if (!name || typeof name !== 'string') return null;
  
  // Pattern to match dimensions like "50×60", "60×50", "05×06", "06×05"
  const dimensionPattern = /(\d{1,2})[×xX](\d{1,2})/g;
  const matches = [];
  
  let match;
  while ((match = dimensionPattern.exec(name)) !== null) {
    const num1 = parseInt(match[1], 10);
    const num2 = parseInt(match[2], 10);
    
    // If both numbers are less than 20, they might be reversed
    if (num1 < 20 && num2 < 20) {
      matches.push({
        original: match[0],
        num1,
        num2,
        position: match.index,
        mightBeReversed: true
      });
    }
  }
  
  return matches.length > 0 ? matches : null;
}

// Function to suggest corrected dimensions
function suggestCorrection(originalDimensions) {
  // This is a heuristic - you'll need to manually verify the correct values
  const { num1, num2 } = originalDimensions;
  
  // Common towel dimensions that might be correct
  const commonDimensions = [
    [50, 60], [60, 50], [40, 60], [60, 40], [30, 50], [50, 30],
    [70, 140], [140, 70], [100, 150], [150, 100]
  ];
  
  // Find the closest match
  let bestMatch = null;
  let bestScore = Infinity;
  
  for (const [dim1, dim2] of commonDimensions) {
    const score = Math.abs(dim1 - num1) + Math.abs(dim2 - num2);
    if (score < bestScore) {
      bestScore = score;
      bestMatch = [dim1, dim2];
    }
  }
  
  return bestMatch;
}

async function findIncorrectDimensions() {
  try {
    await dbConnect();
    
    console.log('🔍 Searching for products with potentially incorrect dimensions...\n');
    
    const barcodes = await Barcode.find({}).lean();
    const issues = [];
    
    for (const barcode of barcodes) {
      if (barcode.name) {
        const dimensionIssues = detectIncorrectDimensions(barcode.name);
        if (dimensionIssues) {
          issues.push({
            code: barcode.code,
            name: barcode.name,
            model: barcode.model,
            dimensionIssues
          });
        }
      }
    }
    
    if (issues.length === 0) {
      console.log('✅ No products with potentially incorrect dimensions found!');
      return;
    }
    
    console.log(`⚠️  Found ${issues.length} products with potentially incorrect dimensions:\n`);
    
    for (const issue of issues) {
      console.log(`📦 Product: ${issue.name}`);
      console.log(`   Barcode: ${issue.code}`);
      console.log(`   Model: ${issue.model || 'N/A'}`);
      
      for (const dimIssue of issue.dimensionIssues) {
        console.log(`   ⚠️  Dimension Issue: "${dimIssue.original}" at position ${dimIssue.position}`);
        
        if (dimIssue.mightBeReversed) {
          const suggestion = suggestCorrection(dimIssue);
          if (suggestion) {
            console.log(`   💡 Suggested correction: ${suggestion[0]}×${suggestion[1]}`);
            console.log(`   📝 Manual verification required!`);
          }
        }
      }
      console.log('');
    }
    
    console.log('🔧 To fix these issues:');
    console.log('   1. Manually verify the correct dimensions for each product');
    console.log('   2. Use the bulk update feature to correct the product names');
    console.log('   3. Or update individual records directly in the database');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
findIncorrectDimensions();
