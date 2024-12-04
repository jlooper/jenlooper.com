export async function POST({ request }) {
  try {
    const body = await request.json();
    
    const response = await fetch('https://36pwhwdfwfegk5tg77a4776aje0gcjzh.lambda-url.us-east-2.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer befb6c67-c021-4388-a39c-014e7fc07beb'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
} 