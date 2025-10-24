// Test script to verify API endpoints are working
// Run this in browser console or as a standalone test

const testAPIEndpoints = async () => {
  console.log('🧪 Testing API Endpoints...');
  
  const testIds = [
    '079bb21b-5153-4964-9cce-7ecafb8bfda3', // Food recommendation
    '0b3dc7a7-d1db-4e6c-90d4-6c47ca2de101', // Apps recommendation
    'd1505be8-fe16-4ae0-b092-e4ea8916bd2f'  // Trip ID
  ];

  for (const id of testIds) {
    console.log(`\n🔍 Testing ID: ${id}`);
    
    // Test individual recommendation endpoint
    try {
      console.log(`📡 Testing GET /api/history/share/${id}`);
      const response = await fetch(`/api/history/share/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success:', {
          success: data.success,
          hasData: !!data.data,
          type: data.data?.recommendationType,
          destination: data.data?.destination
        });
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText);
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
    
    // Test unified trip endpoint
    try {
      console.log(`📡 Testing GET /api/history/share/unified-trips/${id}`);
      const response = await fetch(`/api/history/share/unified-trips/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success:', {
          success: data.success,
          hasData: !!data.data,
          tripId: data.data?.tripId,
          tripName: data.data?.tripName,
          destination: data.data?.destination
        });
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText);
      }
    } catch (error) {
      console.log('❌ Network error:', error.message);
    }
  }
  
  console.log('\n🎯 Testing server connectivity...');
  
  // Test basic server connectivity
  try {
    const response = await fetch('/api/history/filters/types', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log(`📡 Server connectivity test: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log('❌ Server not reachable:', error.message);
  }
  
  console.log('\n✅ API Endpoint Test Completed!');
};

// Export for use
if (typeof window !== 'undefined') {
  window.testAPIEndpoints = testAPIEndpoints;
}

export { testAPIEndpoints };
