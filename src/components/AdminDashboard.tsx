import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Store, 
  Truck, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter,
  MoreVertical,
  Eye,
  Ban,
  TrendingUp,
  Activity,
  Loader2,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  orderBy
} from 'firebase/firestore';
import { User } from '../types';

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<'OVERVIEW' | 'USERS' | 'DRIVERS' | 'MERCHANTS'>('OVERVIEW');
  const [pendingCount, setPendingCount] = useState({ DRIVERS: 0, MERCHANTS: 0 });

  useEffect(() => {
    const q = query(collection(db, 'users'), where('status', '==', 'PENDING_APPROVAL'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts = { DRIVERS: 0, MERCHANTS: 0 };
      snapshot.docs.forEach(doc => {
        const role = doc.data().role;
        if (role === 'DRIVER') counts.DRIVERS++;
        if (role === 'MERCHANT') counts.MERCHANTS++;
      });
      setPendingCount(counts);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Admin Nav */}
      <div className="flex flex-wrap gap-4">
        {[
          { id: 'OVERVIEW', label: 'نظرة عامة', icon: Activity },
          { id: 'USERS', label: 'المستخدمين', icon: Users },
          { id: 'DRIVERS', label: 'السائقين', icon: Truck, badge: pendingCount.DRIVERS },
          { id: 'MERCHANTS', label: 'التجار', icon: Store, badge: pendingCount.MERCHANTS },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={cn(
              "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all border",
              activeView === tab.id 
                ? "bg-slate-900 text-white border-slate-900 shadow-xl" 
                : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
            )}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
            {tab.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeView === 'OVERVIEW' && <OverviewSection />}
      {activeView === 'USERS' && <ManagementTable type="USER" />}
      {activeView === 'DRIVERS' && <ManagementTable type="DRIVER" />}
      {activeView === 'MERCHANTS' && <ManagementTable type="MERCHANT" />}
    </div>
  );
}

function OverviewSection() {
  const [stats, setStats] = useState({ users: 0, activeRides: 0, pendingApprovals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setStats(prev => ({ ...prev, users: snap.size }));
    });
    const unsubRides = onSnapshot(query(collection(db, 'rides'), where('status', '==', 'STARTED')), (snap) => {
      setStats(prev => ({ ...prev, activeRides: snap.size }));
    });
    const unsubPending = onSnapshot(query(collection(db, 'users'), where('status', '==', 'PENDING_APPROVAL')), (snap) => {
      setStats(prev => ({ ...prev, pendingApprovals: snap.size }));
    });
    setLoading(false);
    return () => {
      unsubUsers();
      unsubRides();
      unsubPending();
    };
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-accent" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { label: 'إجمالي المستخدمين', value: stats.users.toLocaleString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'الرحلات النشطة', value: stats.activeRides.toLocaleString(), icon: Truck, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
        { label: 'بانتظار الموافقة', value: stats.pendingApprovals.toLocaleString(), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
      ].map((stat, i) => (
        <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6">
          <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center", stat.bg)}>
            <stat.icon className={cn("w-8 h-8", stat.color)} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ManagementTable({ type }: { type: 'USER' | 'DRIVER' | 'MERCHANT' }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', type));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usrs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usrs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [type]);

  const handleStatusUpdate = async (userId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { status });
      alert('تم تحديث الحالة بنجاح');
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-accent" /></div>;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900">إدارة {type === 'USER' ? 'المستخدمين' : type === 'DRIVER' ? 'السائقين' : 'التجار'}</h3>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="بحث..." 
            className="pr-10 pl-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-accent"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-sm">
            <tr>
              <th className="px-6 py-4 font-bold">الاسم</th>
              <th className="px-6 py-4 font-bold">المستندات</th>
              <th className="px-6 py-4 font-bold">البريد الإلكتروني</th>
              <th className="px-6 py-4 font-bold">الحالة</th>
              <th className="px-6 py-4 font-bold">الرصيد</th>
              <th className="px-6 py-4 font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                      {user.name[0]}
                    </div>
                    <span className="font-bold text-slate-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {user.storeImage && (
                      <a href={user.storeImage} target="_blank" rel="noreferrer" className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-all" title="صورة المتجر">
                        <Store className="w-4 h-4 text-slate-600" />
                      </a>
                    )}
                    {user.driverLicenseImage && (
                      <a href={user.driverLicenseImage} target="_blank" rel="noreferrer" className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-all" title="رخصة القيادة">
                        <FileText className="w-4 h-4 text-slate-600" />
                      </a>
                    )}
                    {user.vehicleRegistrationImage && (
                      <a href={user.vehicleRegistrationImage} target="_blank" rel="noreferrer" className="p-1 bg-slate-100 rounded hover:bg-slate-200 transition-all" title="رخصة السيارة">
                        <Truck className="w-4 h-4 text-slate-600" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    user.status === 'ACTIVE' ? "bg-brand-accent/10 text-brand-accent" :
                    user.status === 'PENDING_APPROVAL' ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"
                  )}>
                    {user.status === 'ACTIVE' ? 'نشط' : user.status === 'PENDING_APPROVAL' ? 'بانتظار الموافقة' : 'محظور'}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-900">{user.walletBalance.toFixed(2)} د.أ</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    {user.status === 'PENDING_APPROVAL' && (
                      <button 
                        onClick={() => handleStatusUpdate(user.id, 'ACTIVE')}
                        className="p-2 bg-brand-accent/10 text-brand-accent rounded-lg hover:bg-brand-accent/20 transition-colors"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                    <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 transition-colors">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(user.id, user.status === 'BANNED' ? 'ACTIVE' : 'BANNED')}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Ban className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
