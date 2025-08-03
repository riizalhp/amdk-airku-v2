export enum Role {
  ADMIN = 'Admin',
  SALES = 'Sales',
  DRIVER = 'Driver',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  password?: string;
}

export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Store {
  id: string;
  name:string;
  address: string;
  location: Coordinate;
  region: string;
  owner: string;
  phone: string;
  subscribedSince: string;
  lastOrder: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number; // Total physical stock
  reservedStock: number; // Stock allocated to pending/routed orders
  capacityUnit: number;
}

export enum VehicleStatus {
  DELIVERING = 'Delivering',
  REPAIR = 'Under Repair',
  IDLE = 'Idle',
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number; // in gallons/units
  status: VehicleStatus;
}

export enum OrderStatus {
  PENDING = 'Pending',
  ROUTED = 'Routed',
  DELIVERING = 'Delivering',
  DELIVERED = 'Delivered',
  FAILED = 'Failed',
}

export interface OrderItem {
    productId: string;
    quantity: number;
    specialPrice?: number;
}

export interface Order {
  id: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  location: Coordinate;
  assignedVehicleId: string | null;
  orderedBy: { id: string; name: string; role: string; };
}

export enum VisitStatus {
    UPCOMING = 'Akan Datang',
    COMPLETED = 'Selesai',
    SKIPPED = 'Dilewati/Gagal',
}

export interface Visit {
  id: string;
  storeId: string;
  salesPersonId: string;
  visitDate: string; // YYYY-MM-DD
  purpose: string;
  status: VisitStatus;
  notes?: string;
  proofOfVisitImage?: string;
}

export interface SoughtProduct {
    brand: string;
    variant: string;
}

export interface CompetitorPrice {
    brand: string;
    variant: string;
    price: number;
}

export interface CompetitorVolume {
    brand: string;
    variant: string;
    volume: string; // e.g., "50 dus/bulan"
}

export interface SurveyResponse {
    id: string;
    salesPersonId: string;
    surveyDate: string;

    // Manual Store Info
    storeName: string;
    storeAddress: string;
    storePhone: string;
    
    // Question 1
    mostSoughtProducts: SoughtProduct[];

    // Question 2
    popularAirkuVariants: string[];

    // Question 3
    competitorPrices: CompetitorPrice[];

    // Question 4
    competitorVolumes: CompetitorVolume[];

    // Question 5
    feedback: string;
}


export interface RouteStop {
  orderId: string;
  storeId: string;
  storeName: string;
  address: string;
  status: 'Pending' | 'Completed' | 'Failed';
  proofOfDeliveryImage?: string;
}

export interface RoutePlan {
  id: string;
  driverId: string;
  vehicleId: string;
  date: string;
  stops: RouteStop[];
  clusterId?: string;
}

export interface SalesVisitStop {
    visitId: string;
    storeId: string;
    storeName: string;
    address: string;
    purpose: string;
}

export interface SalesVisitRoutePlan {
    id: string;
    salesPersonId: string;
    date: string;
    stops: SalesVisitStop[];
}

export enum PartnerType {
    SUPPLIER = 'Supplier',
    DISTRIBUTOR = 'Distributor',
    CORPORATE = 'Korporat'
}

export interface Partner {
    id: string;
    name: string;
    type: PartnerType;
    contactPerson: string;
    email: string;
    phone: string;
    joinDate: string;
}

export interface AppContextType {
  currentUser: User | null;
  users: User[];
  stores: Store[];
  products: Product[];
  vehicles: Vehicle[];
  orders: Order[];
  routes: RoutePlan[];
  partners: Partner[];
  surveyResponses: SurveyResponse[];
  visits: Visit[];
  salesVisitRoutes: SalesVisitRoutePlan[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  addOrder: (order: Omit<Order, 'id' | 'totalAmount' | 'orderDate' | 'status' | 'storeName' | 'location' | 'assignedVehicleId'>) => { success: boolean; message: string };
  updateOrder: (orderId: string, updates: { items: OrderItem[]; assignedVehicleId: string | null }) => { success: boolean; message: string };
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  createRoutePlan: (driverId: string, vehicleId: string) => Promise<void>;
  dispatchVehicle: (vehicleId: string) => void;
  updateRoute: (route: RoutePlan) => void;
  reassignOrder: (orderId: string, newVehicleId: string | null) => boolean;
  completeVehicleRoute: (vehicleId: string) => void;
  
  // Store CRUD
  addStore: (store: Omit<Store, 'id'>) => void;
  updateStore: (store: Store) => void;
  deleteStore: (storeId: string) => void;

  // User CRUD
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;

  // Product CRUD
  addProduct: (product: Omit<Product, 'id' | 'reservedStock'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;

  // Vehicle CRUD
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (vehicleId: string) => void;

  // Partner CRUD
  addPartner: (partner: Omit<Partner, 'id'>) => void;
  updatePartner: (partner: Partner) => void;
  deletePartner: (partnerId: string) => void;
    
  // Survey CRUD
  addSurveyResponse: (response: Omit<SurveyResponse, 'id'>) => void;

  // Visit CRUD
  addVisit: (visit: Omit<Visit, 'id'>) => void;
  updateVisitStatus: (visitId: string, status: VisitStatus, proofImage?: string) => void;
  deleteVisit: (visitId: string) => void;

  // Sales Visit Route CRUD
  createSalesVisitRoutePlan: (salesPersonId: string, visitDate: string) => Promise<void>;
}