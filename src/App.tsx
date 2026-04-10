/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import Layout from './components/Layout';
import AuthPage from './components/AuthPage';
import UserDashboard from './components/UserDashboard';
import MerchantDashboard from './components/MerchantDashboard';
import DriverDashboard from './components/DriverDashboard';
import AdminDashboard from './components/AdminDashboard';
import { UserRole, User } from './types';
import { ShieldAlert, Clock, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<UserRole>('USER');

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      // Clean up previous document listener if it exists
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (firebaseUser) {
        setLoading(true);
        // Listen to user document in Firestore
        unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            setCurrentUser({ ...userData, id: firebaseUser.uid });
            setActiveRole(userData.role);
          } else {
            console.warn("User authenticated but no Firestore document found.");
            setCurrentUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore subscription error:", error);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  // Handle Pending Approval
  if (currentUser.status === 'PENDING_APPROVAL' && currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center space-y-6 shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">حسابك قيد المراجعة</h1>
            <p className="text-slate-500">شكراً لانضمامك إلينا! يتم حالياً مراجعة بياناتك من قبل الإدارة. ستتمكن من استخدام التطبيق فور الموافقة على حسابك.</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  // Handle Banned
  if (currentUser.status === 'BANNED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 text-center space-y-6 shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">تم حظر الحساب</h1>
            <p className="text-slate-500">نأسف لإبلاغك بأنه تم حظر حسابك لمخالفة شروط الاستخدام. يرجى التواصل مع الدعم الفني لمزيد من المعلومات.</p>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeRole={activeRole} 
      onRoleChange={(role) => {
        // Only allow admins to switch roles for testing/management
        if (currentUser.role === 'ADMIN') {
          setActiveRole(role);
        }
      }} 
      userName={currentUser.name} 
      balance={currentUser.walletBalance}
      userRole={currentUser.role}
    >
      {activeRole === 'USER' && <UserDashboard />}
      {activeRole === 'MERCHANT' && <MerchantDashboard />}
      {activeRole === 'DRIVER' && <DriverDashboard />}
      {activeRole === 'ADMIN' && <AdminDashboard />}
    </Layout>
  );
}


