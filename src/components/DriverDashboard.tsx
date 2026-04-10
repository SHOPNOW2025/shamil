import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Star, 
  Power,
  ChevronRight,
  Package,
  Car,
  Calendar,
  Phone,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  orderBy
} from 'firebase/firestore';
import { RideRequest, Order } from '../types';

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [activeTab, setActiveTab] = useState<'STORE' | 'RIDE' | 'SCHEDULED'>('STORE');
  const [stats, setStats] = useState({ earnings: 0, completedRides: 0, rating: 4.9 });
  const [counts, setCounts] = useState({ STORE: 0, RIDE: 0, SCHEDULED: 0 });
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Fetch user name and stats
    const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserName(data.name);
        setStats(prev => ({ ...prev, earnings: data.walletBalance || 0 }));
      }
    });

    // Fetch counts
    const unsubStore = onSnapshot(query(collection(db, 'orders'), where('status', '==', 'WAITING_FOR_DRIVER')), (snap) => {
      setCounts(prev => ({ ...prev, STORE: snap.size }));
    });
    const unsubRide = onSnapshot(query(collection(db, 'rides'), where('status', '==', 'PENDING')), (snap) => {
      setCounts(prev => ({ ...prev, RIDE: snap.size }));
    });

    return () => {
      unsubUser();
      unsubStore();
      unsubRide();
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Driver Status Card */}
      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-slate-100 overflow-hidden">
              <img src={`https://picsum.photos/seed/${auth.currentUser?.uid}/200`} alt="Driver" referrerPolicy="no-referrer" />
            </div>
            <div className={cn(
              "absolute -bottom-2 -left-2 w-6 h-6 rounded-full border-4 border-white",
              isOnline ? "bg-brand-accent" : "bg-slate-300"
            )}></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">أهلاً بك، كابتن {userName.split(' ')[0]}</h2>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{stats.rating}</span>
              </div>
              <div className="text-slate-400 text-sm">• {stats.completedRides} رحلة مكتملة</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left md:text-right">
            <div className="text-xs text-slate-500 font-medium mb-1">المحفظة</div>
            <div className="text-2xl font-bold text-slate-900">{stats.earnings.toFixed(2)} د.أ</div>
          </div>
          <button 
            onClick={() => setIsOnline(!isOnline)}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg",
              isOnline 
                ? "bg-red-500 text-white shadow-red-500/20 hover:bg-red-600" 
                : "bg-brand-primary text-white shadow-brand-primary/20 hover:bg-brand-secondary"
            )}
          >
            <Power className="w-5 h-5" />
            {isOnline ? 'إيقاف العمل' : 'بدء العمل'}
          </button>
        </div>
      </div>

      {!isOnline ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Power className="w-10 h-10 text-slate-300" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">أنت الآن غير متصل</h3>
            <p className="text-slate-500 max-w-sm mx-auto">قم بتفعيل وضع "بدء العمل" لاستقبال الطلبات والرحلات الجديدة في منطقتك.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'STORE', label: 'طلبات المتاجر', icon: Package, count: counts.STORE },
              { id: 'RIDE', label: 'رحلات الركاب', icon: Car, count: counts.RIDE },
              { id: 'SCHEDULED', label: 'نقل الموظفين', icon: Calendar, count: counts.SCHEDULED },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all border",
                  activeTab === tab.id 
                    ? "bg-brand-primary text-white border-brand-primary shadow-xl" 
                    : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px]",
                  activeTab === tab.id ? "bg-brand-accent text-slate-900" : "bg-slate-100 text-slate-500"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              <RequestsSection type={activeTab} />
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function RequestsSection({ type }: { type: 'STORE' | 'RIDE' | 'SCHEDULED' }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === 'SCHEDULED') {
      setRequests([]);
      setLoading(false);
      return;
    }

    const collName = type === 'STORE' ? 'orders' : 'rides';
    const statusField = 'status';
    const statusValue = type === 'STORE' ? 'WAITING_FOR_DRIVER' : 'PENDING';

    const q = query(
      collection(db, collName),
      where(statusField, '==', statusValue),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(reqs);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [type]);

  const handleAccept = async (reqId: string) => {
    if (!auth.currentUser) return;
    const collName = type === 'STORE' ? 'orders' : 'rides';
    const newStatus = type === 'STORE' ? 'ON_THE_WAY' : 'ACCEPTED';
    
    try {
      await updateDoc(doc(db, collName, reqId), {
        status: newStatus,
        driverId: auth.currentUser.uid
      });
      alert('تم قبول الطلب بنجاح!');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء قبول الطلب');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-accent" /></div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {requests.length === 0 ? (
        <div className="md:col-span-2 text-center py-20 text-slate-400">
          {type === 'SCHEDULED' ? 'خدمة نقل الموظفين ستتوفر قريباً' : 'لا توجد طلبات متاحة حالياً'}
        </div>
      ) : requests.map((req) => (
        <RequestCard 
          key={req.id} 
          request={req} 
          type={type} 
          onAccept={() => handleAccept(req.id)}
        />
      ))}
    </div>
  );
}

function RequestCard({ request, type, onAccept }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 group"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-brand-accent group-hover:text-slate-900 transition-colors">
            {type === 'STORE' ? <Package className="w-6 h-6" /> : <Car className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="font-bold text-slate-900">
              {type === 'STORE' ? 'توصيل طلب متجر' : (request.type === 'PASSENGER' ? 'طلب رحلة' : 'توصيل غرض')}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              <span>منذ قليل</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 font-medium leading-none mb-1">الأجر المتوقع</div>
          <div className="font-bold text-brand-accent">
            {type === 'STORE' ? '3.50' : (request.maxPrice || '0.00')} د.أ
          </div>
        </div>
      </div>

      <div className="space-y-3 relative">
        <div className="absolute right-[7px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
        <div className="flex items-center gap-4 relative">
          <div className="w-4 h-4 rounded-full border-4 border-white bg-brand-accent shadow-sm z-10"></div>
          <span className="text-sm text-slate-600 font-medium">{request.startLocation?.address || 'موقع الاستلام'}</span>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className="w-4 h-4 rounded-full border-4 border-white bg-red-500 shadow-sm z-10"></div>
          <span className="text-sm text-slate-600 font-medium">{request.endLocation?.address || 'موقع التسليم'}</span>
        </div>
      </div>

      <button 
        onClick={onAccept}
        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
      >
        قبول الطلب
      </button>
    </motion.div>
  );
}
