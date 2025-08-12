
import { collection, doc, getDoc, getDocs, query, where, Timestamp, orderBy, limit, startAt, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface Trip {
    id: number;
    title: string;
    description: string;
  }
  
  export interface PackageDetails {
    id: string; // packageId
    name: string;
    trips: Trip[];
    promotionalPrice: number;
    regularPrice: number;
    nonRefundableNote: string;
    terms: string[];
  }
  
  const mockTemplatePackage: Omit<PackageDetails, 'id' | 'promotionalPrice'> = {
    name: 'Exclusive Vacation Bundle',
    trips: [
      { id: 1, title: '8 Day / 7 Night Condo Stay', description: '200+ US & 200+ International locations – Covers 4 Adults or Family of 5' },
      { id: 2, title: '6 Day / 5 Night Cruise', description: 'Carnival, Norwegian, or Royal Caribbean – Covers 2 Adults' },
      { id: 3, title: '5 Day / 4 Night Condo Stay', description: '45 US Hotspots – Covers 4 Adults or Family of 5' },
      { id: 4, title: '5 Day / 4 Night Condo Stay', description: '45 US Hotspots – Covers 4 Adults or Family of 5' },
      { id: 5, title: '5 Day / 4 Night All-Inclusive', description: '12 Tropical Destinations – Covers 2 Adults + 2 Kids' },
    ],
    regularPrice: 2498,
    nonRefundableNote: 'All packages are non-refundable due to the incredible discount.',
    terms: [
        "All packages are strictly non-refundable due to deep discounts.",
        "Packages are fulfilled by Monster Reservations Group.",
        "The first trip must be a 5-day/4-night vacation with a required 90-minute property tour (timeshare presentation).",
        "The property tour must be completed before any other trips can be redeemed.",
        "Your package expires **36 months** from the date of purchase, unless insurance with extended terms is purchased. You must complete all travel by this date."
    ]
  };
  
  export const getPackageDetails = async (packageId: string): Promise<PackageDetails | null> => {
    // This now fetches the specific package details from Firestore.
    if (!packageId) return null;
  
    try {
      const packagesRef = collection(db, 'packages');
      const q = query(packagesRef, where("packageId", "==", packageId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        // If it's the base package ID for the template, return the template.
        if (packageId === 'PK998A') {
             return {
                id: 'PK998A',
                promotionalPrice: 998,
                ...mockTemplatePackage,
             }
        }
        return null;
      }
  
      const packageDoc = querySnapshot.docs[0];
      const packageData = packageDoc.data();
  
      return {
        ...mockTemplatePackage,
        id: packageData.packageId,
        promotionalPrice: packageData.price || mockTemplatePackage.regularPrice, // Fallback to regular if price isn't set
      };
    } catch (error) {
      console.error("Error fetching package details from Firestore:", error);
      return null;
    }
  };
  
  export interface CompanySale {
      customerName: string;
      agentName: string;
      packageId: string;
      date: Date;
      revenue: number;
  }

  export interface AgentRank {
      id: string;
      name: string;
      totalSales: number;
      totalRevenue: number;
  }

  export interface CompanyDashboardData {
      totalPackagesSold: number;
      totalRevenue: number;
      activeAgents: number;
      totalSales: number;
      recentSales: CompanySale[];
      salesOverTime: { date: string; sales: number }[];
      agentLeaderboard: AgentRank[];
  }
  
  export const getCompanyDashboardData = async (companyId: string): Promise<CompanyDashboardData> => {
      if (!companyId) throw new Error("Company ID is required.");
      
      const agentsQuery = query(collection(db, 'agents'), where('companyId', '==', companyId));
      const agentsSnapshot = await getDocs(agentsQuery);
      const activeAgents = agentsSnapshot.docs.filter(doc => doc.data().status === 'Active').length;
      
      const agentIds = agentsSnapshot.docs.map(doc => doc.id);
      const agentMap = new Map(agentsSnapshot.docs.map(doc => [doc.id, doc.data().name]));

      let totalPackagesSold = 0;
      let totalRevenue = 0;
      let recentSales: CompanySale[] = [];
      const salesOverTimeMap = new Map<string, number>();
      const agentLeaderboardMap = new Map<string, { totalSales: number, totalRevenue: number }>();
      const customerIds = new Set<string>();
      let allPaidPackages: any[] = [];

      if (agentIds.length > 0) {
        const packagesQuery = query(collection(db, 'packages'), where('agentId', 'in', agentIds), where('status', 'in', ['Paid', 'Deposit Paid']));
        const packagesSnapshot = await getDocs(packagesQuery);
        
        allPaidPackages = packagesSnapshot.docs.map(d => d.data());
        
        // First pass: aggregate data and collect customer IDs
        for (const pkg of allPaidPackages) {
            if (pkg.customerId) {
                customerIds.add(pkg.customerId);
            }
        }
        
        // Fetch all needed customers in one go
        const customerMap = new Map<string, string>();
        if (customerIds.size > 0) {
            const customersQuery = query(collection(db, 'customers'), where('authUid', 'in', Array.from(customerIds)));
            const customersSnapshot = await getDocs(customersQuery);
            customersSnapshot.forEach(doc => {
                customerMap.set(doc.id, doc.data()?.name || 'Customer');
            });
        }
        
        // Second pass: process packages with customer data
        for (const pkg of allPaidPackages) {
            const revenue = pkg.pricePaid || pkg.depositPaid || 0;
            const saleDate = (pkg.purchaseDate || pkg.depositDate as Timestamp)?.toDate() ?? new Date();
            
            totalPackagesSold++;
            totalRevenue += revenue;
            
            // For recent sales
            if (recentSales.length < 10) {
                 recentSales.push({
                    customerName: pkg.customerId ? (customerMap.get(pkg.customerId) || 'Unnamed Customer') : 'Unclaimed',
                    agentName: agentMap.get(pkg.agentId) || 'Unknown Agent',
                    packageId: pkg.packageId,
                    date: saleDate,
                    revenue: revenue,
                 });
            }

            // For sales over time
            const dateString = saleDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            salesOverTimeMap.set(dateString, (salesOverTimeMap.get(dateString) || 0) + 1);
            
            // For agent leaderboard
            const currentStats = agentLeaderboardMap.get(pkg.agentId) || { totalSales: 0, totalRevenue: 0 };
            agentLeaderboardMap.set(pkg.agentId, {
                totalSales: currentStats.totalSales + 1,
                totalRevenue: currentStats.totalRevenue + revenue,
            });
        }
      }
      
      const salesOverTime = Array.from(salesOverTimeMap.entries())
        .map(([date, sales]) => ({ date, sales }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const agentLeaderboard: AgentRank[] = Array.from(agentLeaderboardMap.entries())
        .map(([agentId, data]) => ({
            id: agentId,
            name: agentMap.get(agentId) || 'Unknown Agent',
            ...data
        }))
        .sort((a,b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10);
      
      recentSales.sort((a,b) => b.date.getTime() - a.date.getTime());

      return {
        totalPackagesSold,
        totalRevenue,
        activeAgents,
        totalSales: totalPackagesSold,
        recentSales,
        salesOverTime,
        agentLeaderboard,
      };
  }

  export interface RecentSale {
    customerName: string;
    packageId: string;
    saleDate: Date;
    amountPaid: number;
    insurance: string;
  }
  
  export interface AgentDashboardData {
      agentName: string;
      agentId: string;
      companyId: string;
      companyName: string;
      totalSales: number;
      totalRevenue: number;
      last5Sales: RecentSale[];
  }

  export const getAgentDashboardData = async(agentUid: string, companyId: string): Promise<AgentDashboardData> => {
      if (!agentUid || !companyId) {
        throw new Error("Agent UID and Company ID are required.");
      }
      
      const agentDocRef = doc(db, 'agents', agentUid);
      const companyDocRef = doc(db, 'companies', companyId);

      try {
        const [agentDocSnap, companyDocSnap] = await Promise.all([
            getDoc(agentDocRef),
            getDoc(companyDocRef)
        ]);

        if (!agentDocSnap.exists()) {
            throw new Error(`Agent with UID ${agentUid} not found.`);
        }
        
        const agentData = agentDocSnap.data();
        const companyName = companyDocSnap.exists() ? companyDocSnap.data().name : 'Unknown Company';
        
        let totalSales = 0;
        let totalRevenue = 0;
        let allSales: RecentSale[] = [];
        const customerIds = new Set<string>();

        const allPackagesQuery = query(collection(db, 'packages'), where('agentId', '==', agentUid), where('status', 'in', ['Paid', 'Deposit Paid']));
        const allPackagesSnapshot = await getDocs(allPackagesQuery);
        const allPaidPackages = allPackagesSnapshot.docs.map(d => d.data());

        // First pass: collect customer IDs
        allPaidPackages.forEach(pkgData => {
            if (pkgData.customerId) {
                customerIds.add(pkgData.customerId);
            }
        });
        
        // Fetch all needed customers in one go
        const customerMap = new Map<string, string>();
        if (customerIds.size > 0) {
            const customersQuery = query(collection(db, 'customers'), where('authUid', 'in', Array.from(customerIds)));
            const customersSnapshot = await getDocs(customersQuery);
            customersSnapshot.forEach(doc => {
                customerMap.set(doc.id, doc.data()?.name || 'Customer');
            });
        }
        
        // Second pass: process packages
        for (const pkgData of allPaidPackages) {
            const saleAmount = pkgData.pricePaid || pkgData.depositPaid || 0;
            totalRevenue += saleAmount;
            
            allSales.push({
                customerName: pkgData.customerId ? (customerMap.get(pkgData.customerId) || 'Unclaimed') : 'Unclaimed',
                packageId: pkgData.packageId,
                saleDate: (pkgData.purchaseDate || pkgData.depositDate as Timestamp)?.toDate() ?? new Date(),
                amountPaid: saleAmount,
                insurance: pkgData.insurance || 'None',
            });
        }
        
        totalSales = allPackagesSnapshot.size;
        const last5Sales = allSales
            .sort((a, b) => b.saleDate.getTime() - a.saleDate.getTime())
            .slice(0, 5);

        return {
            agentName: agentData?.name || 'Unknown Agent',
            agentId: agentData?.referralCode || 'N/A',
            companyId: companyId,
            companyName: companyName,
            totalSales,
            totalRevenue,
            last5Sales,
        };
      } catch (error) {
          console.error("Error fetching agent dashboard data:", error);
          throw error;
      }
  }
  
  export interface CustomerPackage {
      id: string; // packageId
      title: string;
      status: 'Pending' | 'Active' | 'Redeemed' | 'Expired' | 'Deposit Paid';
      trips: Trip[];
      insuranceType: 'none' | 'standard' | 'double-up';
      expirationDate?: Date;
      referralCode: string;
      price?: number;
  }

  export interface CustomerDashboardData {
      customerName: string;
      packages: CustomerPackage[];
  }

  export const getCustomerDashboardData = async(customerId: string | null): Promise<CustomerDashboardData> => {
      if (!customerId) {
        return { customerName: 'Guest', packages: [] };
      }

      const customerDocRef = doc(db, 'customers', customerId);
      const customerDocSnap = await getDoc(customerDocRef);
      const customerName = customerDocSnap.exists() ? customerDocSnap.data()?.name : 'Customer';

      const packagesRef = collection(db, 'packages');
      const q = query(packagesRef, where("customerId", "==", customerId));
      const querySnapshot = await getDocs(q);
      
      const packages: CustomerPackage[] = [];

      for (const doc of querySnapshot.docs) {
          const pkgData = doc.data();
          const basePackage = await getPackageDetails(pkgData.packageId);
          if (!basePackage) continue;

          let expirationDate: Date | undefined = undefined;
          if (pkgData.purchaseDate && pkgData.purchaseDate instanceof Timestamp) {
              const purchaseDate = pkgData.purchaseDate.toDate();
              expirationDate = new Date(purchaseDate);
              const monthsToExpire = pkgData.insurance === 'standard' ? 54 : 36;
              expirationDate.setMonth(expirationDate.getMonth() + monthsToExpire);
          }
          
          let status = pkgData.status;
          if (status === 'Active' && expirationDate && new Date() > expirationDate && pkgData.insurance !== 'double-up') {
              status = 'Expired';
          }
          if (status === 'Deposit Paid' && pkgData.paymentDueDate && new Date() > pkgData.paymentDueDate.toDate()) {
              status = 'Expired';
          }


          packages.push({
              id: pkgData.packageId,
              title: basePackage.name,
              status: status,
              trips: basePackage.trips,
              insuranceType: pkgData.insurance || 'none',
              expirationDate: expirationDate,
              referralCode: pkgData.referralCode,
              price: pkgData.price,
          });
      }

      return {
          customerName,
          packages: packages.sort((a, b) => (a.status === 'Pending' || a.status === 'Deposit Paid' ? -1 : 1)),
      };
  }

export interface AdminCompany {
    id: string;
    name: string;
    agents: number;
    totalSales: number;
    totalRevenue: number;
}

export interface AdminAgent {
    id: string;
    name: string;
    companyName: string;
    totalSales: number;
    totalRevenue: number;
}

export interface AdminDashboardData {
    totalSales: number;
    totalRevenue: number;
    topCompanies: AdminCompany[];
    allCompanies: AdminCompany[];
    topAgents: AdminAgent[];
}

export const getAdminDashboardData = async (): Promise<AdminDashboardData> => {
    let totalSales = 0;
    let totalRevenue = 0;

    const companiesSnapshot = await getDocs(collection(db, "companies"));
    const companyMap = new Map(companiesSnapshot.docs.map(doc => [doc.id, doc.data()]));
    
    const allCompanies: AdminCompany[] = [];
    const agentLeaderboard: AdminAgent[] = [];
    
    for (const companyDoc of companiesSnapshot.docs) {
        const companyId = companyDoc.id;
        const companyData = companyDoc.data();
        let companySales = 0;
        let companyRevenue = 0;

        const agentsQuery = query(collection(db, "agents"), where("companyId", "==", companyId));
        const agentsSnapshot = await getDocs(agentsQuery);
        
        for (const agentDoc of agentsSnapshot.docs) {
            const agentId = agentDoc.id;
            const agentData = agentDoc.data();
            let agentSales = 0;
            let agentRevenue = 0;
            
            const packagesQuery = query(collection(db, 'packages'), where('agentId', '==', agentId), where('status', 'in', ['Paid', 'Deposit Paid']));
            const packagesSnapshot = await getDocs(packagesQuery);
            
            agentSales = packagesSnapshot.size;
            agentRevenue = packagesSnapshot.docs.reduce((sum, pkgDoc) => sum + (pkgDoc.data().pricePaid || pkgDoc.data().depositPaid || 0), 0);
            
            companySales += agentSales;
            companyRevenue += agentRevenue;
            
            agentLeaderboard.push({
                id: agentId,
                name: agentData.name,
                companyName: companyData?.name || 'Unknown Company',
                totalSales: agentSales,
                totalRevenue: agentRevenue,
            });
        }
        
        allCompanies.push({
            id: companyId,
            name: companyData.name,
            agents: agentsSnapshot.size,
            totalSales: companySales,
            totalRevenue: companyRevenue
        });

        totalSales += companySales;
        totalRevenue += companyRevenue;
    }
    
    const topCompanies = [...allCompanies].sort((a,b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
    const topAgents = [...agentLeaderboard].sort((a,b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
    
    return {
        totalSales,
        totalRevenue,
        topCompanies,
        allCompanies,
        topAgents,
    };
}

export interface AgentCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  packageId: string;
  status: 'Paid' | 'Pending' | 'Expired' | 'Deposit Paid';
  insurance: 'None' | 'Standard' | 'Double Up';
  joinDate: Date;
  pricePaid: number;
  depositPaid: number;
  paymentDueDate?: Date;
}

export const getAgentCustomers = async (agentUid: string): Promise<AgentCustomer[]> => {
    if (!agentUid) return [];
    
    try {
        const customersRef = collection(db, 'customers');
        const q = query(customersRef, where('agentId', '==', agentUid));
        const customerSnapshot = await getDocs(q);
        
        const customers: AgentCustomer[] = [];

        for (const custDoc of customerSnapshot.docs) {
            const customerData = custDoc.data();
            
            const packagesRef = collection(db, 'packages');
            const pkgQuery = query(packagesRef, where('customerId', '==', custDoc.id));
            const packageSnapshot = await getDocs(pkgQuery);
            
            if (packageSnapshot.empty) {
                continue; // Skip if no package found for this customer
            }

            const packageDoc = packageSnapshot.docs[0];
            const packageData = packageDoc.data();
            
            customers.push({
                id: custDoc.id,
                name: customerData.name || 'Unnamed Customer',
                email: customerData.email || 'No Email',
                phone: customerData.phone || 'No Phone',
                packageId: packageData.packageId,
                status: packageData.status,
                insurance: packageData.insurance || 'None',
                joinDate: (customerData.createdAt as Timestamp)?.toDate() ?? new Date(),
                pricePaid: packageData.pricePaid || 0,
                depositPaid: packageData.depositPaid || 0,
                paymentDueDate: (packageData.paymentDueDate as Timestamp)?.toDate()
            });
        }
        
        return customers.sort((a, b) => b.joinDate.getTime() - a.joinDate.getTime());

    } catch (error) {
        console.error("Error fetching agent customers:", error);
        return [];
    }
}

interface PendingPackage {
    packageId: string;
    referralCode: string;
}

export const getAgentPendingPackages = async (referralCode: string): Promise<PendingPackage[]> => {
    if (!referralCode) return [];
    try {
        const packagesRef = collection(db, 'packages');
        const q = query(
            packagesRef, 
            where('referralCode', '==', referralCode), 
            where('status', '==', 'Pending'),
            where('customerId', '==', null)
        );
        const querySnapshot = await getDocs(q);
        const pendingPackages = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                packageId: data.packageId,
                referralCode: data.referralCode,
            };
        });
        return pendingPackages;
    } catch (error) {
        console.error("Error fetching pending packages:", error);
        return [];
    }
};


export const getStripePaymentLink = async (): Promise<string | null> => {
    // This function is now deprecated in favor of dynamically created checkout sessions.
    // It is no longer used by the checkout page.
    return null;
}
