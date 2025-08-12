
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AgentData {
  name: string;
  referralCode: string;
  companyId: string;
  companyName: string;
}

interface CustomerData {
  name: string;
  uid: string;
}

interface AuthContextType {
  user: User | null;
  agentData: AgentData | null;
  customerData: CustomerData | null;
  loading: boolean;
  logout: () => Promise<void>;
  login: (email: string, pass: string, type: 'agent' | 'customer') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        
        // Check if user is an agent OR a customer
        try {
            const agentDocRef = doc(db, 'agents', user.uid);
            const customerDocRef = doc(db, 'customers', user.uid);

            const [agentDocSnap, customerDocSnap] = await Promise.all([
                getDoc(agentDocRef),
                getDoc(customerDocRef)
            ]);

            if (agentDocSnap.exists()) {
                const agent = agentDocSnap.data();
                const companyDocRef = doc(db, 'companies', agent.companyId);
                const companyDocSnap = await getDoc(companyDocRef);
                const companyName = companyDocSnap.exists() ? companyDocSnap.data().name : 'Unknown Company';
                
                setAgentData({
                    name: agent.name,
                    referralCode: agent.referralCode,
                    companyId: agent.companyId,
                    companyName: companyName,
                });
                setCustomerData(null);
                sessionStorage.setItem('agentId', agent.referralCode);
                sessionStorage.setItem('agentUid', user.uid);
                sessionStorage.setItem('companyId', agent.companyId);
            } else if (customerDocSnap.exists()){
                 const customer = customerDocSnap.data();
                 setCustomerData({
                     name: customer.name,
                     uid: user.uid,
                 });
                 setAgentData(null);
                 sessionStorage.setItem('isCustomer', 'true');
                 sessionStorage.setItem('customerName', customer.name);
                 sessionStorage.setItem('customerUid', user.uid);
            } else {
                 setAgentData(null);
                 setCustomerData(null);
            }
        } catch(error) {
            console.error("Error fetching user data:", error);
            setAgentData(null);
            setCustomerData(null);
        }
      } else {
        setUser(null);
        setAgentData(null);
        setCustomerData(null);
        sessionStorage.clear();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string, type: 'agent' | 'customer') => {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      if (type === 'customer') {
          const customerDocRef = doc(db, "customers", user.uid);
          const customerDocSnap = await getDoc(customerDocRef);
          if (!customerDocSnap.exists()) {
            await signOut(auth);
            throw { code: 'auth/not-a-customer' };
          }
      } else if (type === 'agent') {
          const agentDocRef = doc(db, 'agents', user.uid);
          const agentDocSnap = await getDoc(agentDocRef);
           if (!agentDocSnap.exists()) {
            await signOut(auth);
            throw { code: 'auth/not-an-agent' };
          }
      }
  }


  const logout = async () => {
    await signOut(auth);
  };

  const value = { user, agentData, customerData, loading, logout, login };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
