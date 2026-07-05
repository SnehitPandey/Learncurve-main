async function test() {
  try {
    const response = await fetch('http://localhost:5000/rooms', {
      method: 'POST',
      body: JSON.stringify({
        title: 'javascript',
        topic: 'javascript',
        description: '',
        tags: ['javascript'],
        skillLevel: 'Advanced',
        maxSeats: 6,
        generateRoadmap: true,
        expectedDurationDays: 30
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error("Validation failed:", data);
    } else {
      console.log("Success:", data);
    }
  } catch (err) {
    console.error("Network Error:", err.message);
  }
}

test();
