import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Mail, Lock, User as UserIcon, ArrowRight, Chrome, Store, MapPin, Truck, Plus, X, Upload, FileText, Camera } from 'lucide-react';
import { UserRole } from '../types';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { uploadImage } from '../services/imageService';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface AuthPageProps {
  onAuthSuccess: () => void;
}

function LocationPicker({ onLocationSelect, position }: { onLocationSelect: (lat: number, lng: number) => void, position: [number, number] | null }) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProfileMissing, setIsProfileMissing] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (auth.currentUser) {
        try {
          const docSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (!docSnap.exists()) {
            setIsProfileMissing(true);
          }
        } catch (err) {
          console.error("Error checking profile:", err);
        }
      }
    };
    checkProfile();
  }, []);

  // Merchant specific
  const [storeName, setStoreName] = useState('');
  const [storeCategory, setStoreCategory] = useState('FOOD');
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [address, setAddress] = useState('');
  const [storeImage, setStoreImage] = useState<File | null>(null);
  const [firstProduct, setFirstProduct] = useState({ name: '', price: '', description: '', image: null as File | null });

  // Driver specific
  const [vehicleType, setVehicleType] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [licenseImage, setLicenseImage] = useState<File | null>(null);
  const [regImage, setRegImage] = useState<File | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && step === 1 && (role === 'MERCHANT' || role === 'DRIVER')) {
      setStep(2);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Handle image uploads
        let storeImageUrl = '';
        let licenseImageUrl = '';
        let regImageUrl = '';
        let firstProductImageUrl = '';

        if (role === 'MERCHANT') {
          if (storeImage) storeImageUrl = await uploadImage(storeImage);
          if (firstProduct.image) firstProductImageUrl = await uploadImage(firstProduct.image);
        } else if (role === 'DRIVER') {
          if (licenseImage) licenseImageUrl = await uploadImage(licenseImage);
          if (regImage) regImageUrl = await uploadImage(regImage);
        }

        const userData: any = {
          name,
          email,
          role,
          walletBalance: 0,
          status: (role === 'USER' || email === 'abedalshame0778400696@gmail.com') ? 'ACTIVE' : 'PENDING_APPROVAL',
          createdAt: new Date().toISOString()
        };

        if (email === 'abedalshame0778400696@gmail.com') {
          userData.role = 'ADMIN';
        }

        if (role === 'MERCHANT') {
          userData.storeName = storeName;
          userData.storeCategory = storeCategory;
          userData.storeImage = storeImageUrl;
          userData.location = { 
            lat: location?.[0] || 31.95, 
            lng: location?.[1] || 35.91, 
            address 
          };
        } else if (role === 'DRIVER') {
          userData.vehicleType = vehicleType;
          userData.plateNumber = plateNumber;
          userData.driverLicenseImage = licenseImageUrl;
          userData.vehicleRegistrationImage = regImageUrl;
        }

        // Create user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), userData);

        // If merchant, add first product
        if (role === 'MERCHANT' && firstProduct.name) {
          await setDoc(doc(db, 'products', `${user.uid}_first`), {
            name: firstProduct.name,
            price: parseFloat(firstProduct.price),
            category: storeCategory,
            description: firstProduct.description,
            merchantId: user.uid,
            image: firstProductImageUrl || `https://picsum.photos/seed/${firstProduct.name}/600/400`
          });
        }
      }
      onAuthSuccess();
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('خطأ في الاتصال: يرجى التأكد من إضافة رابط التطبيق إلى "Authorized Domains" في Firebase Console، أو تأكد من جودة الإنترنت.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName || 'مستخدم جديد',
          email: user.email || '',
          role: 'USER',
          walletBalance: 0,
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        });
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100"
      >
        <div className="p-8 md:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-white/10 mb-4 overflow-hidden animate-float">
              <img 
                src="https://i.ibb.co/27vv6NhH/image.png" 
                alt="Logo" 
                className="w-full h-full object-contain p-2"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/shamil/100';
                }}
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">الشامل للتوصيل</h1>
            <p className="text-slate-500 text-sm">
              {isProfileMissing ? 'حدث خطأ في ملفك الشخصي' : isLogin ? 'مرحباً بك مجدداً' : step === 1 ? 'ابدأ رحلتك معنا اليوم' : 'أكمل معلومات حسابك'}
            </p>
          </div>

          {isProfileMissing ? (
            <div className="space-y-4 p-6 bg-amber-50 rounded-3xl border border-amber-100 text-center">
              <p className="text-sm text-amber-800">يبدو أن هناك مشكلة في حسابك. يرجى تسجيل الخروج والمحاولة مرة أخرى أو إنشاء حساب جديد.</p>
              <button 
                onClick={() => signOut(auth).then(() => window.location.reload())}
                className="w-full bg-amber-600 text-white py-3 rounded-2xl font-bold hover:bg-amber-700 transition-all"
              >
                تسجيل الخروج والمحاولة مجدداً
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <div className="space-y-4">
                      <div className="relative">
                        <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="الاسم الكامل" 
                          required 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['USER', 'MERCHANT', 'DRIVER'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${
                              role === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
                            }`}
                          >
                            {r === 'USER' ? 'مستخدم' : r === 'MERCHANT' ? 'تاجر' : 'سائق'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="email" 
                      placeholder="البريد الإلكتروني" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                      type="password" 
                      placeholder="كلمة المرور" 
                      required 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  {role === 'MERCHANT' ? (
                    <>
                      <div className="relative">
                        <Store className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="اسم المتجر" 
                          required 
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 px-1">صورة المتجر</p>
                        <div className="flex items-center gap-4">
                          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                            <Upload className="w-5 h-5 text-slate-400" />
                            <span className="text-sm text-slate-500">{storeImage ? storeImage.name : 'اختر صورة'}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setStoreImage(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                      </div>
                      <select 
                        value={storeCategory}
                        onChange={(e) => setStoreCategory(e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all appearance-none"
                      >
                        <option value="FOOD">طعام</option>
                        <option value="DRINK">مشروبات</option>
                        <option value="GROCERY">بقالة</option>
                        <option value="VEGETABLES_FRUITS">خضار وفواكه</option>
                      </select>
                      
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500 px-1">حدد موقع المتجر على الخريطة</p>
                        <div className="h-40 rounded-2xl overflow-hidden border border-slate-200 relative z-0">
                          <MapContainer center={[31.95, 35.91]} zoom={13} style={{ height: '100%', width: '100%' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <LocationPicker position={location} onLocationSelect={(lat, lng) => setLocation([lat, lng])} />
                          </MapContainer>
                        </div>
                        <input 
                          type="text" 
                          placeholder="العنوان بالتفصيل (مثال: طبربور، شارع الاستقلال)" 
                          required 
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all text-sm"
                        />
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                          <Plus className="w-4 h-4" /> أضف منتجك الأول
                        </p>
                        <input 
                          type="text" 
                          placeholder="اسم المنتج" 
                          value={firstProduct.name}
                          onChange={(e) => setFirstProduct({...firstProduct, name: e.target.value})}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                        />
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="السعر (د.أ)" 
                            value={firstProduct.price}
                            onChange={(e) => setFirstProduct({...firstProduct, price: e.target.value})}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                          />
                          <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
                            <Camera className="w-4 h-4 text-slate-400" />
                            <span className="text-[10px] text-slate-500 truncate">{firstProduct.image ? firstProduct.image.name : 'صورة'}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setFirstProduct({...firstProduct, image: e.target.files?.[0] || null})} />
                          </label>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <Truck className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="نوع المركبة" 
                          required 
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                        />
                      </div>
                      <div className="relative">
                        <Package className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input 
                          type="text" 
                          placeholder="رقم اللوحة" 
                          required 
                          value={plateNumber}
                          onChange={(e) => setPlateNumber(e.target.value)}
                          className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 px-1">رخصة القيادة</p>
                          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <span className="text-xs text-slate-500">{licenseImage ? licenseImage.name : 'ارفع صورة الرخصة'}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setLicenseImage(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-500 px-1">رخصة السيارة</p>
                          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 border border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <span className="text-xs text-slate-500">{regImage ? regImage.name : 'ارفع صورة رخصة السيارة'}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => setRegImage(e.target.files?.[0] || null)} />
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    العودة للخطوة السابقة
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <p className="text-red-500 text-[10px] font-medium text-center">{error}</p>}

            <button 
              disabled={loading}
              className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-brand-secondary transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 border border-white/10"
            >
              {loading ? 'جاري التحميل...' : (isLogin ? 'تسجيل الدخول' : step === 1 && (role === 'MERCHANT' || role === 'DRIVER') ? 'التالي' : 'إنشاء حساب')}
              <ArrowRight className="w-5 h-5 text-brand-accent" />
            </button>
          </form>
        )}

          {step === 1 && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">أو عبر</span></div>
              </div>

              <button 
                onClick={handleGoogleSignIn}
                className="w-full bg-white border border-slate-200 text-slate-600 py-3.5 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                <Chrome className="w-5 h-5 text-blue-500" />
                الدخول بواسطة جوجل
              </button>
            </>
          )}

          <p className="text-center text-sm text-slate-500">
            {isLogin ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setStep(1);
              }}
              className="text-brand-accent font-bold mr-1 hover:underline"
            >
              {isLogin ? 'أنشئ حساباً' : 'سجل دخولك'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
