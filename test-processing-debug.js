// Function to process product name and model to fix dimension issues
const processProductText = (text) => {
  if (!text) return text;
  
  console.log('Processing text:', text); // Debug log
  
  // Replace common dimension patterns with corrected values
  const replacements = [
    { pattern: /54×5×5/g, replacement: '60' },
    { pattern: /5×5×54/g, replacement: '60' },
    { pattern: /54\s*×\s*5\s*×\s*5/g, replacement: '60' },
    { pattern: /5\s*×\s*5\s*×\s*54/g, replacement: '60' },
    { pattern: /54x5x5/g, replacement: '60' },
    { pattern: /5x5x54/g, replacement: '60' },
    { pattern: /54\s*x\s*5\s*x\s*5/g, replacement: '60' },
    { pattern: /5\s*x\s*5\s*x\s*54/g, replacement: '60' },
    // Add more patterns as needed
  ];
  
  let processedText = text;
  replacements.forEach(({ pattern, replacement }) => {
    const oldText = processedText;
    processedText = processedText.replace(pattern, replacement);
    if (oldText !== processedText) {
      console.log(`Replaced "${oldText}" with "${processedText}"`); // Debug log
    }
  });
  
  return processedText;
};

// Test the exact string from the API response
const testString = "حوله خشک کن فلت 54×5×5";
console.log('Original:', testString);
console.log('Processed:', processProductText(testString));

// Test with encoded characters
const testString2 = "Ø­ÙÙ\n       Ù Ø®Ø´Ú© Ú©Ù ÙÙ\n                      Øª 54×5×5";
console.log('Encoded test:', testString2);
console.log('Processed encoded:', processProductText(testString2));
