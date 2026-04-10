import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Package, 
  ClipboardList, 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Loader2,
  X,
  Upload,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { uploadImage } from '../services/imageService';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { Product, Order } from '../types';

export default function MerchantDashboard() {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'PRODUCTS' | 'ANALYTICS'>('ORDERS');
  const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0, rating: 4.8 });

  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), where('merchantId', '==', auth.currentUser.uid)), (snap) => {
      const ords = snap.docs.map(doc => doc.data());
      const totalSales = ords.reduce((acc, curr: any) => acc + (curr.status === 'DELIVERED' ? curr.totalPrice : 0), 0);
      setStats(prev => ({
        ...prev,
        totalOrders: snap.size,
        totalSales
      }));
    });

    return () => unsubOrders();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'إجمالي الطلبات', value: stats.totalOrders.toString(), icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'إجمالي المبيعات', value: `${stats.totalSales.toFixed(2)} د.أ`, icon: DollarSign, color: 'text-brand-accent', bg: 'bg-brand-accent/10' },
          { label: 'تقييم المتجر', value: `${stats.rating}/5`, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg)}>
              <stat.icon className={cn("w-7 h-7", stat.color)} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'ORDERS', label: 'الطلبات الحالية', icon: ClipboardList },
          { id: 'PRODUCTS', label: 'إدارة المنتجات', icon: Package },
          { id: 'ANALYTICS', label: 'الإحصائيات', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 font-bold transition-all relative",
              activeTab === tab.id ? "text-brand-primary" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-accent rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'ORDERS' && <OrdersSection />}
          {activeTab === 'PRODUCTS' && <ProductsSection />}
          {activeTab === 'ANALYTICS' && <div className="p-12 text-center text-slate-400">قسم الإحصائيات قادم قريباً</div>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'orders'), 
      where('merchantId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(ords);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 ? (
          <div className="text-center py-20 text-slate-400">لا توجد طلبات حالياً</div>
        ) : orders.map((order, i) => (
          <div key={order.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                order.status === 'PENDING' ? "bg-amber-100 text-amber-600" :
                order.status === 'PREPARING' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
              )}>
                {order.status === 'PENDING' ? <Clock className="w-6 h-6" /> :
                 order.status === 'PREPARING' ? <Edit3 className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">#{order.id.slice(0, 8)}</span>
                  <span className="text-xs text-slate-400">• {new Date(order.createdAt).toLocaleTimeString('ar-JO')}</span>
                </div>
                <div className="text-sm text-slate-600">
                  {order.items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ')}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-6">
              <div className="text-left">
                <div className="text-xs text-slate-500 leading-none mb-1">الإجمالي</div>
                <div className="font-bold text-slate-900">{order.totalPrice.toFixed(2)} د.أ</div>
              </div>
              <div className="flex gap-2">
                {order.status === 'PENDING' && (
                  <button onClick={() => updateStatus(order.id, 'PREPARING')} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-600 transition-all">قبول</button>
                )}
                {order.status === 'PREPARING' && (
                  <button onClick={() => updateStatus(order.id, 'WAITING_FOR_DRIVER')} className="bg-blue-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition-all">جاهز للتسليم</button>
                )}
                {order.status === 'WAITING_FOR_DRIVER' && (
                  <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                    <Clock className="w-4 h-4" />
                    بانتظار السائق
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'FOOD', description: '', image: null as File | null });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'products'), where('merchantId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(prods);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setUploading(true);
    try {
      let imageUrl = `https://picsum.photos/seed/${Date.now()}/600/400`;
      if (newProduct.image) {
        imageUrl = await uploadImage(newProduct.image);
      }

      await addDoc(collection(db, 'products'), {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        description: newProduct.description,
        merchantId: auth.currentUser.uid,
        image: imageUrl
      });
      setIsAdding(false);
      setNewProduct({ name: '', price: '', category: 'FOOD', description: '', image: null });
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء إضافة المنتج');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">قائمة المنتجات</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة منتج جديد
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="اسم المنتج" 
                required 
                value={newProduct.name}
                onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <input 
                type="number" 
                placeholder="السعر" 
                required 
                value={newProduct.price}
                onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <div className="md:col-span-2 space-y-2">
                <p className="text-xs font-bold text-slate-500 px-1">صورة المنتج</p>
                <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">{newProduct.image ? newProduct.image.name : 'اختر صورة للمنتج'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setNewProduct({...newProduct, image: e.target.files?.[0] || null})} />
                </label>
              </div>
              <select 
                value={newProduct.category}
                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent"
              >
                <option value="FOOD">طعام</option>
                <option value="DRINK">مشروبات</option>
                <option value="GROCERY">بقالة</option>
                <option value="VEGETABLES_FRUITS">خضار وفواكه</option>
              </select>
              <input 
                type="text" 
                placeholder="وصف بسيط" 
                value={newProduct.description}
                onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent"
              />
              <div className="md:col-span-2 flex gap-2">
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-bold hover:bg-brand-secondary transition-all disabled:opacity-50"
                >
                  {uploading ? 'جاري الرفع...' : 'حفظ المنتج'}
                </button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">إلغاء</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">لا توجد منتجات حالياً</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="h-40 bg-slate-100 relative">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <button onClick={() => handleDelete(product.id)} className="p-2 bg-white/90 backdrop-blur rounded-lg text-slate-600 hover:text-red-600 transition-colors shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900">{product.name}</h4>
                  <p className="text-xs text-slate-500">{product.category}</p>
                </div>
                <div className="font-bold text-emerald-600">{product.price.toFixed(2)} د.أ</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
