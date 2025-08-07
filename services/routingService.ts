import { Coordinate } from '../types';

export interface RouteNode {
    id: string;
    location: Coordinate;
    demand: number;
}

function haversineDistance(coord1: Coordinate, coord2: Coordinate): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
    const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
    const lat1 = coord1.lat * (Math.PI / 180);
    const lat2 = coord2.lat * (Math.PI / 180);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export function calculateSavingsMatrixRoutes(nodes: RouteNode[], depot: Coordinate, vehicleCapacity: number): string[][] {
    if (nodes.length === 0) {
        return [];
    }

    // 1. Calculate distance matrix and savings list
    const distances: { [key: string]: number } = {}; // key: "id1-id2"
    nodes.forEach(n1 => {
        distances[`depot-${n1.id}`] = haversineDistance(depot, n1.location);
        nodes.forEach(n2 => {
            if (n1.id !== n2.id) {
                const key = [n1.id, n2.id].sort().join('-');
                if (!distances[key]) {
                    distances[key] = haversineDistance(n1.location, n2.location);
                }
            }
        });
    });

    const savingsList: { i: string, j: string, saving: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const nodeI = nodes[i];
            const nodeJ = nodes[j];
            const distDepotI = distances[`depot-${nodeI.id}`];
            const distDepotJ = distances[`depot-${nodeJ.id}`];
            const distIJ = distances[[nodeI.id, nodeJ.id].sort().join('-')];
            
            const saving = distDepotI + distDepotJ - distIJ;
            savingsList.push({ i: nodeI.id, j: nodeJ.id, saving });
        }
    }

    savingsList.sort((a, b) => b.saving - a.saving);

    // 2. Initialize routes
    let routes: string[][] = nodes.map(node => [node.id]);
    const routeLoads = new Map<string[], number>();
    nodes.forEach(node => {
        const route = routes.find(r => r[0] === node.id)!;
        routeLoads.set(route, node.demand);
    });

    // 3. Merge routes
    for (const { i, j } of savingsList) {
        const routeI = routes.find(r => r.includes(i));
        const routeJ = routes.find(r => r.includes(j));

        if (!routeI || !routeJ || routeI === routeJ) {
            continue; // Already in the same route
        }

        const loadI = routeLoads.get(routeI)!;
        const loadJ = routeLoads.get(routeJ)!;

        if (loadI + loadJ > vehicleCapacity) {
            continue; // Exceeds capacity
        }

        // Check if i and j are endpoints of their routes
        const iIsAtStart = routeI[0] === i;
        const iIsAtEnd = routeI[routeI.length - 1] === i;
        const jIsAtStart = routeJ[0] === j;
        const jIsAtEnd = routeJ[routeJ.length - 1] === j;

        let merged = false;
        let newRoute: string[] | undefined;
        
        if (iIsAtEnd && jIsAtStart) {
            newRoute = [...routeI, ...routeJ];
            merged = true;
        } else if (iIsAtStart && jIsAtEnd) {
            newRoute = [...routeJ, ...routeI];
            merged = true;
        } else if (iIsAtEnd && jIsAtEnd) {
            newRoute = [...routeI, ...routeJ.reverse()];
            merged = true;
        } else if (iIsAtStart && jIsAtStart) {
            newRoute = [...routeI.reverse(), ...routeJ];
            merged = true;
        }

        if (merged && newRoute) {
             // Update routes list and loads
            const newRoutes = routes.filter(r => r !== routeI && r !== routeJ);
            newRoutes.push(newRoute);
            routes = newRoutes;

            routeLoads.delete(routeI);
            routeLoads.delete(routeJ);
            routeLoads.set(newRoute, loadI + loadJ);
        }
    }
    
    return routes;
}
