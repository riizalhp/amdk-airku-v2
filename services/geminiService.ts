import { Order, Coordinate, Store, Visit } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "z-ai/glm-4.5-air:free";
const OPENROUTER_SITE_URL = process.env.SITE_URL || "http://localhost:5173";
const OPENROUTER_SITE_NAME = process.env.SITE_NAME || "KU AIRKU Distribution Management";

async function callOpenRouter(messages: any[]): Promise<string> {
  const headers: Record<string, string> = {
    "Authorization": `Bearer ${process.env.API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": OPENROUTER_SITE_URL,
    "X-Title": OPENROUTER_SITE_NAME,
  };

  const body: any = {
    model: OPENROUTER_MODEL,
    messages: messages,
  };

  try {
    const response = await fetch(OPENROUTER_API_BASE, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    throw error;
  }
}

export async function clusterOrders(orders: Order[], numClusters: number): Promise<any> {
  const prompt = `
    Given the following list of pending orders with their store locations (latitude, longitude),
    group them into ${numClusters} geographical clusters using a clustering algorithm like K-Means.
    
    Orders:
    ${JSON.stringify(orders.map(o => ({ id: o.id, location: o.location })), null, 2)}
    
    Return a JSON object where each key is a cluster ID (e.g., "cluster_1", "cluster_2") and the value is an array of order IDs belonging to that cluster.
  `;

  const messages = [{ role: "user", content: prompt }];
  const rawResponse = await callOpenRouter(messages);
  return JSON.parse(rawResponse);
}

export async function classifyStoreRegion(storeLocation: Coordinate): Promise<{ region: 'Timur' | 'Barat' | 'Bukan di Kulon Progo' }> {
  const pdamKulonProgoLongitude = 110.1486773;

  const prompt = `
    You are a geographical data analyst for KU AIRKU, a water distributor in Kulon Progo Regency, Yogyakarta, Indonesia.
    Your task is to classify a new store location into one of our two sales territories: 'Timur' (East) or 'Barat' (West), or determine if it's outside our service area.

    Here are the rules:
    1.  Our service area is strictly within Kulon Progo Regency. A very rough bounding box for Kulon Progo is between latitudes -7.67 to -8.00 and longitudes 110.00 to 110.30.
    2.  The dividing line for our territories is the longitude of our main office, PDAM Tirta Binangun, which is at longitude ${pdamKulonProgoLongitude}.
    3.  Any location east of this longitude is 'Timur'.
    4.  Any location west of this longitude is 'Barat'.
    5.  Any location outside the Kulon Progo bounding box is 'Bukan di Kulon Progo'.

    A new store has been added at this location:
    ${JSON.stringify(storeLocation)}

    Follow these steps:
    1.  Check if the new store's latitude is between -7.67 and -8.00 AND its longitude is between 110.00 and 110.30.
    2.  If it is NOT within this bounding box, classify it as 'Bukan di Kulon Progo'.
    3.  If it IS within the bounding box, compare its longitude to the dividing line (${pdamKulonProgoLongitude}).
    4.  If the store's longitude is greater than ${pdamKulonProgoLongitude}, classify it as 'Timur'.
    5.  If the store's longitude is less than or equal to ${pdamKulonProgoLongitude}, classify it as 'Barat'.

    Return a JSON object with a single key "region" and the classified territory name as its value (either 'Timur', 'Barat', or 'Bukan di Kulon Progo').
  `;

  const messages = [{ role: "user", content: prompt }];
  const rawResponse = await callOpenRouter(messages);
  return JSON.parse(rawResponse);
}