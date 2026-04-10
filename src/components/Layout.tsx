import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  Wallet, 
  ShoppingBag, 
  Car, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Bell,
  Menu,
  X,
  User as UserIcon,
  Store,
  Truck,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  userName: string;
  balance: number;
  userRole: UserRole;
}

export default function Layout({ children, activeRole, onRoleChange, userName, balance, userRole }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const roles = [
    { id: 'USER', label: 'مستخدم', icon: UserIcon },
    { id: 'MERCHANT', label: 'تاجر', icon: Store },
    { id: 'DRIVER', label: 'سائق', icon: Truck },
    { id: 'ADMIN', label: 'إدارة', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <img 
              src="https://i.ibb.co/27vv6NhH/image.png" 
              alt="الشامل" 
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/shamil/100';
              }}
            />
            <span className="font-bold text-xl text-slate-900">الشامل</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-left">
            <div className="text-xs text-slate-500">المحفظة</div>
            <div className="font-bold text-brand-accent">{(balance || 0).toFixed(2)} د.أ</div>
          </div>
          <button className="p-2 hover:bg-slate-100 rounded-full relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-y-0 right-0 z-50 w-72 bg-slate-900 text-white flex flex-col shadow-2xl lg:relative lg:translate-x-0",
              !isSidebarOpen && "hidden lg:flex"
            )}
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-brand-accent rounded-2xl flex items-center justify-center shadow-xl border border-white/10 overflow-hidden animate-float">
                  <img 
                    src="https://i.ibb.co/27vv6NhH/image.png" 
                    alt="Logo" 
                    className="w-full h-full object-contain p-1"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/shamil/100';
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-2xl tracking-tight text-brand-accent">الشامل</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] leading-none">للتوصيل</span>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-4 py-6 flex-1 overflow-y-auto">
              {userRole === 'ADMIN' && (
                <div className="mb-8">
                  <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">تبديل الحساب (للمسؤول)</p>
                  <div className="space-y-1">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          onRoleChange(role.id as UserRole);
                          setIsSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                          activeRole === role.id 
                            ? "bg-brand-accent text-slate-900 shadow-lg shadow-brand-accent/20 font-bold scale-[1.02]" 
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <role.icon className="w-5 h-5" />
                        <span className="font-medium">{role.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">القائمة</p>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">الإعدادات</span>
                </button>
                <button 
                  onClick={() => signOut(auth)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">تسجيل الخروج</span>
                </button>
              </div>
            </div>

            <div className="p-4 mt-auto border-t border-slate-800">
              <div className="flex items-center gap-3 px-2 py-3">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-lg font-bold">
                  {userName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-sm">{userName}</div>
                  <div className="text-xs text-slate-500">{activeRole}</div>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden lg:flex bg-white border-b px-8 py-4 items-center justify-between sticky top-0 z-40">
          <h1 className="text-xl font-bold text-slate-900">
            {activeRole === 'USER' && 'لوحة تحكم المستخدم'}
            {activeRole === 'MERCHANT' && 'لوحة تحكم التاجر'}
            {activeRole === 'DRIVER' && 'لوحة تحكم السائق'}
            {activeRole === 'ADMIN' && 'لوحة تحكم الإدارة'}
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">
              <Wallet className="w-5 h-5 text-brand-accent" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 leading-none">الرصيد الحالي</span>
                <span className="font-bold text-slate-900">{(balance || 0).toFixed(2)} د.أ</span>
              </div>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-full relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
