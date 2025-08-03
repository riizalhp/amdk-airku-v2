import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Order, Coordinate, Store, Visit } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function clusterOrders(orders: Order[], numClusters: number): Promise<any> {
  const prompt = `
    Given the following list of pending orders with their store locations (latitude, longitude), 
    group them into ${numClusters} geographical clusters using a clustering algorithm like K-Means.
    
    Orders:
    ${JSON.stringify(orders.map(o => ({ id: o.id, location: o.location })), null, 2)}
    
    Return a JSON object where each key is a cluster ID (e.g., "cluster_1", "cluster_2") and the value is an array of order IDs belonging to that cluster.
  `;

  const clusterProperties: { [key: string]: object } = {};
  for (let i = 1; i <= numClusters; i++) {
    clusterProperties[`cluster_${i}`] = { type: Type.ARRAY, items: { type: Type.STRING } };
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: clusterProperties,
        },
      },
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error clustering orders:", error);
    throw error;
  }
}

export async function optimizeAndSequenceRoute(
  orders: Order[],
  depotLocation: Coordinate
): Promise<any> {
  const prompt = `
    You are a logistics optimization expert for a water delivery service. Your task is to solve a Vehicle Routing Problem (VRP) with a Time Window aspect, specifically using the Nearest Neighbour heuristic.

    Depot Location: ${JSON.stringify(depotLocation)}
    
    List of deliveries (orders):
    ${JSON.stringify(orders.map(o => ({ id: o.id, name: o.storeName, location: o.location })), null, 2)}
    
    Starting from the depot, determine the most efficient sequence of deliveries.
    
    Return a JSON object containing a single key "sequence" with a value that is an array of order IDs in the optimal delivery order.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sequence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error optimizing and sequencing route:", error);
    throw error;
  }
}

export async function classifyStoreRegion(storeLocation: Coordinate, allStores: Store[]): Promise<{ region: 'Utara' | 'Tengah' | 'Selatan' }> {
  const prompt = `
    You are a geographical data analyst for KU AIRKU in Gunung Kidul.
    Your task is to classify a new store into one of our three sales territories: 'Utara', 'Tengah', or 'Selatan' using the K-Means Clustering methodology.

    Here are the existing stores, which form our current clusters:
    ${JSON.stringify(allStores.map(s => ({ name: s.name, location: s.location, region: s.region })), null, 2)}

    A new store has been added at this location:
    ${JSON.stringify(storeLocation)}

    1.  For each territory ('Utara', 'Tengah', 'Selatan'), calculate its geographical center (centroid) based on the locations of the existing stores in that territory.
    2.  Calculate the distance from the new store's location to each of the three territory centroids.
    3.  Assign the new store to the territory with the nearest centroid.

    Return a JSON object with a single key "region" and the classified territory name as its value (either 'Utara', 'Tengah', or 'Selatan').
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            region: { type: Type.STRING },
          },
        },
      },
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error classifying store region:", error);
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
        }
    }).filter(v => v.location);

    const prompt = `
        You are a logistics optimization expert for a sales team. Your task is to solve a Traveling Salesperson Problem (TSP) for a list of store visits using the Nearest Neighbour heuristic.

        List of store visits for the day:
        ${JSON.stringify(visitLocations, null, 2)}
        
        Determine the most efficient sequence of visits. There is no fixed starting or ending point, just find the best path that covers all locations.
        
        Return a JSON object containing a single key "sequence" with a value that is an array of visit IDs in the optimal visit order.
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        sequence: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                    },
                },
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Error optimizing sales visit route:", error);
        throw error;
    }
}