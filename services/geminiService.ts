import { Order, Coordinate, Store, Visit } from "../types";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const YOUR_SITE_URL = "http://localhost:5173"; // Ganti dengan URL situs Anda yang sebenarnya
const YOUR_SITE_NAME = "AMDK Airku"; // Ganti dengan nama situs Anda yang sebenarnya

if (!OPENROUTER_API_KEY) {
  throw new Error("VITE_OPENROUTER_API_KEY environment variable not set");
}

async function callOpenRouterApi(model: string, messages: { role: string; content: string }[]): Promise<any> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": YOUR_SITE_NAME,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.6, // Dapat disesuaikan
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    throw error;
  }
}

export async function optimizeAndSequenceRoute(
  orders: Order[],
  depotLocation: Coordinate
): Promise<{ sequence: string[] }> {
  const orderDetails = orders.map(o => ({ id: o.id, name: o.storeName, location: o.location }));

  const prompt = `
    You are a logistics optimization expert for a water delivery service. Your task is to solve a Vehicle Routing Problem (VRP) with a Time Window aspect, specifically using the Nearest Neighbour heuristic.

    Depot Location: ${JSON.stringify(depotLocation)}
    
    List of deliveries (orders):
    ${JSON.stringify(orderDetails, null, 2)}
    
    Starting from the depot, determine the most efficient sequence of deliveries.
    
    Return a JSON object containing a single key "sequence" with a value that is an array of order IDs in the optimal delivery order.
    Only return the JSON object, nothing else.
  `;

  try {
    const response = await callOpenRouterApi("z-ai/glm-4.5-air:free", [{ role: "user", content: prompt }]);
    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    } else {
      // Fallback if no markdown block is found, try to parse directly
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error optimizing and sequencing route with OpenRouter:", error);
    throw error;
  }
}

export async function optimizeSalesVisitRoute(visits: Visit[], stores: Store[]): Promise<{ sequence: string[] }> {
  const visitLocations = visits.map(v => {
    const store = stores.find(s => s.id === v.storeId);
    return {
      id: v.id,
      location: store?.location,
      storeName: store?.name,
    };
  }).filter(v => v.location);

  const prompt = `
    You are a logistics optimization expert for a sales team. Your task is to solve a Traveling Salesperson Problem (TSP) for a list of store visits using the Nearest Neighbour heuristic.

    List of store visits for the day:
    ${JSON.stringify(visitLocations, null, 2)}
    
    Determine the most efficient sequence of visits. There is no fixed starting or ending point, just find the best path that covers all locations.
    
    Return a JSON object containing a single key "sequence" with a value that is an array of visit IDs in the optimal visit order.
    Only return the JSON object, nothing else.
  `;

  try {
    const response = await callOpenRouterApi("z-ai/glm-4.5-air:free", [{ role: "user", content: prompt }]);
    const content = response.choices[0].message.content;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    } else {
      // Fallback if no markdown block is found, try to parse directly
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error optimizing sales visit route with OpenRouter:", error);
    throw error;
  }
}
