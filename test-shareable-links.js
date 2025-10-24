// Test script to verify shareable links work
// This can be run in the browser console or as a simple test

const testShareableLinks = async () => {
  console.log('Testing shareable links implementation...');
  
  // Test data from your sample entries
  const testIds = [
    '079bb21b-5153-4964-9cce-7ecafb8bfda3', // Food recommendation
    '096bf439-230c-4674-a841-ef87d04f4d5d', // Lingo recommendation  
    '0b3dc7a7-d1db-4e6c-90d4-6c47ca2de101', // Apps recommendation
    'd1505be8-fe16-4ae0-b092-e4ea8916bd2f', // Trip ID
    '4a77b721-7fcb-40f2-a485-5e67e2671f39', // Trip ID
    'ff144b3b-6e80-403b-9e8c-a2be438aaff9'  // Trip ID
  ];

  for (const id of testIds) {
    try {
      console.log(`Testing ID: ${id}`);
      
      // Test individual recommendation endpoint
      const individualResponse = await fetch(`/api/history/share/${id}`);
      if (individualResponse.ok) {
        const data = await individualResponse.json();
        console.log(`✅ Individual recommendation found for ${id}:`, data.data.recommendationType);
        continue;
      }
      
      // Test unified trip endpoint
      const unifiedResponse = await fetch(`/api/history/share/unified-trips/${id}`);
      if (unifiedResponse.ok) {
        const data = await unifiedResponse.json();
        console.log(`✅ Unified trip found for ${id}:`, data.data.tripName || 'Unnamed Trip');
        continue;
      }
      
      console.log(`❌ No data found for ${id}`);
      
    } catch (error) {
      console.log(`❌ Error testing ${id}:`, error.message);
    }
  }
  
  console.log('Shareable links test completed!');
};

// Export for use
if (typeof window !== 'undefined') {
  window.testShareableLinks = testShareableLinks;
}

export { testShareableLinks };
