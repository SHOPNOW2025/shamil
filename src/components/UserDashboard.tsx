import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Car, 
  Package, 
  Calendar, 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  ChevronRight,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Wallet,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { CATEGORIES, RIDE_PRICES } from '../constants';
import { db, auth } from '../lib/firebase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  increment,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { Product, RideRequest, Order } from '../types';

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'STORE' | 'RIDE' | 'DELIVERY' | 'SCHEDULED' | 'WALLET'>('STORE');

  const tabs = [
    { id: 'STORE', label: 'المتجر', icon: ShoppingBag },
    { id: 'RIDE', label: 'طلب سيارة', icon: Car },
    { id: 'DELIVERY', label: 'توصيل غرض', icon: Package },
    { id: 'SCHEDULED', label: 'نقل موظفين', icon: Calendar },
    { id: 'WALLET', label: 'المحفظة', icon: CreditCard },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all duration-300",
              activeTab === tab.id 
                ? "bg-brand-accent text-slate-900 shadow-lg shadow-brand-accent/20 font-bold" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-bold">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'STORE' && <StoreSection />}
          {activeTab === 'RIDE' && <RideSection type="PASSENGER" />}
          {activeTab === 'DELIVERY' && <RideSection type="ITEM" />}
          {activeTab === 'SCHEDULED' && <ScheduledSection />}
          {activeTab === 'WALLET' && <WalletSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StoreSection() {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => {
    if (!p || !p.name) return false;
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOrder = async (product: Product) => {
    if (!auth.currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (userData && userData.walletBalance >= product.price) {
        // Deduct from wallet
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          walletBalance: increment(-product.price)
        });

        // Create order
        await addDoc(collection(db, 'orders'), {
          userId: auth.currentUser.uid,
          merchantId: product.merchantId,
          items: [{ productId: product.id, quantity: 1, name: product.name }],
          totalPrice: product.price,
          status: 'PENDING',
          createdAt: new Date().toISOString()
        });

        alert('تم الطلب بنجاح!');
      } else {
        alert('رصيد المحفظة غير كافٍ!');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الطلب');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="ابحث عن مطعم أو منتج..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setSelectedCategory('ALL')}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              selectedCategory === 'ALL' ? "bg-brand-primary text-white" : "bg-white text-slate-600 border border-slate-200"
            )}
          >
            الكل
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                selectedCategory === cat.id ? "bg-brand-primary text-white" : "bg-white text-slate-600 border border-slate-200"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-slate-400">لا توجد منتجات حالياً</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
            >
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img 
                  src={product.image || `https://picsum.photos/seed/${product.id}/600/400`} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-brand-accent">
                  متوفر
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{product.name}</h3>
                    <p className="text-sm text-slate-500">{product.description}</p>
                  </div>
                  <span className="font-bold text-brand-accent">{product.price.toFixed(2)} د.أ</span>
                </div>
                <button 
                  onClick={() => handleOrder(product)}
                  className="w-full bg-brand-primary text-white py-3 rounded-2xl font-bold hover:bg-brand-secondary transition-colors flex items-center justify-center gap-2 border border-white/10"
                >
                  <Plus className="w-5 h-5 text-brand-accent" />
                  شراء الآن
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function RideSection({ type }: { type: 'PASSENGER' | 'ITEM' }) {
  const prices = type === 'PASSENGER' ? RIDE_PRICES.PASSENGER : RIDE_PRICES.ITEM;
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);
  const [picking, setPicking] = useState<'START' | 'END' | null>(null);
  const [maxPrice, setMaxPrice] = useState('');
  const [itemType, setItemType] = useState('');
  const [itemSize, setItemSize] = useState('SMALL');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (!auth.currentUser || !start || !end) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'rides'), {
        userId: auth.currentUser.uid,
        startLocation: { 
          address: start,
          lat: startCoords?.[0],
          lng: startCoords?.[1]
        },
        endLocation: { 
          address: end,
          lat: endCoords?.[0],
          lng: endCoords?.[1]
        },
        maxPrice: parseFloat(maxPrice) || 0,
        estimatedPrice: 0,
        status: 'PENDING',
        type,
        itemDetails: type === 'ITEM' ? { type: itemType, size: itemSize } : null,
        createdAt: new Date().toISOString()
      });
      alert('تم إرسال طلبك بنجاح!');
      setStart('');
      setEnd('');
      setStartCoords(null);
      setEndCoords(null);
      setMaxPrice('');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">
              {type === 'PASSENGER' ? 'اطلب رحلتك الآن' : 'توصيل غرض'}
            </h2>
            <p className="text-slate-500">
              {type === 'PASSENGER' 
                ? 'حدد وجهتك وسنقوم بتوصيلك بأمان وبأفضل سعر.' 
                : 'حدد مكان الاستلام والتسليم وسنقوم بنقل غرضك بعناية.'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-accent"></div>
              <input 
                type="text" 
                placeholder="نقطة الانطلاق (أو اختر من الخريطة)" 
                value={start}
                onFocus={() => setPicking('START')}
                onChange={(e) => setStart(e.target.value)}
                className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none"
              />
            </div>
            <div className="relative">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500"></div>
              <input 
                type="text" 
                placeholder="وجهة الوصول (أو اختر من الخريطة)" 
                value={end}
                onFocus={() => setPicking('END')}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none"
              />
            </div>
            {type === 'ITEM' && (
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="نوع الغرض" 
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none"
                />
                <select 
                  value={itemSize}
                  onChange={(e) => setItemSize(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none appearance-none"
                >
                  <option value="SMALL">حجم صغير</option>
                  <option value="MEDIUM">حجم متوسط</option>
                  <option value="LARGE">حجم كبير</option>
                </select>
              </div>
            )}
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">د.أ</span>
              <input 
                type="number" 
                placeholder="الحد الأقصى للمبلغ الذي تود دفعه" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full pr-4 pl-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-brand-accent/10 rounded-2xl border border-brand-accent/20">
            <div className="flex justify-between items-center text-sm">
              <span className="text-brand-primary">التسعيرة لكل كيلو</span>
              <span className="font-bold text-brand-primary">{prices.PER_KM.toFixed(2)} د.أ</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-brand-primary">رسوم الوقت (لكل دقيقة)</span>
              <span className="font-bold text-brand-primary">{prices.PER_MINUTE.toFixed(2)} د.أ</span>
            </div>
          </div>

          <button 
            onClick={handleRequest}
            disabled={loading}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 border border-white/10"
          >
            {loading ? 'جاري الإرسال...' : 'تأكيد الطلب'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl min-h-[400px] relative overflow-hidden border border-slate-200 shadow-sm">
        <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/90 backdrop-blur p-3 rounded-xl border border-slate-200 shadow-lg text-xs font-bold text-slate-600 text-center">
          {picking === 'START' ? 'انقر على الخريطة لتحديد نقطة الانطلاق' : picking === 'END' ? 'انقر على الخريطة لتحديد وجهة الوصول' : 'اختر المواقع من الخريطة'}
        </div>
        <MapContainer center={[31.95, 35.91]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapEvents onLocationSelect={(lat, lng) => {
            if (picking === 'START') {
              setStartCoords([lat, lng]);
              setStart(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            } else if (picking === 'END') {
              setEndCoords([lat, lng]);
              setEnd(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          }} />
          {startCoords && <Marker position={startCoords} icon={L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] })} />}
          {endCoords && <Marker position={endCoords} icon={L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] })} />}
        </MapContainer>
        
        <div className="absolute bottom-6 left-6 right-6 z-[1000] bg-white/90 backdrop-blur p-4 rounded-2xl border border-white/20 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-accent/10 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-brand-accent" />
            </div>
            <div>
              <div className="text-xs text-slate-500">الوقت المتوقع للوصول</div>
              <div className="font-bold text-slate-900">8 - 12 دقيقة</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ScheduledSection() {
  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">نقل الموظفين المجدول</h2>
            <p className="text-slate-500">اشترك في خدمة التوصيل الشهري أو الأسبوعي لدوامك.</p>
          </div>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            طلب اشتراك جديد
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-start">
                <div className="bg-brand-accent/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold">
                  نشط
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">القيمة المدفوعة</div>
                  <div className="font-bold text-slate-900">45.00 د.أ / شهرياً</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
                  <span className="text-sm font-medium">المنزل (طبربور)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">العمل (الدوار السابع)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>الأحد - الخميس</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>08:00 ص - 04:00 م</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WalletSection() {
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (!auth.currentUser || !depositAmount) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        walletBalance: increment(parseFloat(depositAmount))
      });
      alert('تم الإيداع بنجاح!');
      setDepositAmount('');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الإيداع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">إجمالي الرصيد</p>
                <h2 className="text-4xl font-bold tracking-tight">
                  <WalletBalance />
                </h2>
              </div>
              <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-brand-accent" />
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="المبلغ المراد إيداعه" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-accent"
                />
                <button 
                  onClick={handleDeposit}
                  disabled={loading}
                  className="bg-brand-accent hover:bg-brand-gold text-slate-900 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-brand-accent/20 disabled:opacity-50"
                >
                  {loading ? '...' : 'إيداع'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">آخر العمليات</h3>
            <button className="text-brand-accent text-sm font-bold hover:underline">عرض الكل</button>
          </div>
          <div className="space-y-4">
            {[
              { type: 'PURCHASE', label: 'شراء من مطعم السعادة', amount: -12.50, date: 'اليوم، 12:30 م' },
              { type: 'DEPOSIT', label: 'إيداع نقدي', amount: 50.00, date: 'أمس، 09:15 ص' },
              { type: 'RIDE', label: 'رحلة توصيل', amount: -4.20, date: '10 أبريل، 08:45 م' },
            ].map((op, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    op.amount > 0 ? "bg-brand-accent/10 text-brand-accent" : "bg-slate-100 text-slate-600"
                  )}>
                    {op.amount > 0 ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{op.label}</div>
                    <div className="text-xs text-slate-500">{op.date}</div>
                  </div>
                </div>
                <div className={cn("font-bold", op.amount > 0 ? "text-brand-accent" : "text-slate-900")}>
                  {op.amount > 0 ? '+' : ''}{op.amount.toFixed(2)} د.أ
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">طرق الدفع المحفوظة</h3>
          <div className="space-y-3">
            <div className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-slate-900 rounded flex items-center justify-center text-[10px] text-white font-bold">VISA</div>
                <span className="text-sm font-medium">**** 4582</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
            </div>
            <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-medium hover:bg-slate-50 transition-all">
              + إضافة بطاقة جديدة
            </button>
          </div>
        </div>

        <div className="bg-brand-primary p-6 rounded-3xl text-white space-y-4 shadow-lg shadow-brand-primary/20">
          <h3 className="font-bold">برنامج المكافآت</h3>
          <p className="text-sm text-white/70">اجمع النقاط مع كل رحلة واستبدلها برصيد في محفظتك.</p>
          <div className="flex items-center justify-between pt-2">
            <div className="text-2xl font-bold">450 <span className="text-sm font-normal opacity-75">نقطة</span></div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

function WalletBalance() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setBalance(doc.data().walletBalance || 0);
      }
    });
    return () => unsubscribe();
  }, []);

  return <>{balance.toFixed(2)} <span className="text-xl font-normal text-slate-400">د.أ</span></>;
}
