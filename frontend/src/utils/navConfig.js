import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Building2,
  Pill,
  ShoppingCart,
  Package,
  BarChart2
} from 'lucide-react';

export const navConfig = {

  // ── ADMIN ────────────────────────────────────────────────────────────────
  admin: [
    { title: 'Clinic Overview', path: '/admin/dashboard',       icon: Building2 },
    { title: 'Branches',        path: '/admin/branches',         icon: Building2 },
    { title: 'Clinic Staff',    path: '/admin/clinic-staff',     icon: Users },
    { title: 'Medicine Stock',  path: '/admin/medicine-stock',   icon: Pill },
    { title: 'Reports & Stock', path: '/admin/clinic-reports',   icon: BarChart2 },
    { title: 'Settings',        path: '/admin/settings',         icon: Settings },
  ],

  // ── RECEPTIONIST ─────────────────────────────────────────────────────────
  receptionist: [
    { title: 'Dashboard',   path: '/receptionist/dashboard',    icon: LayoutDashboard },
    { title: 'Appointments',path: '/receptionist/appointments', icon: Calendar },
    { title: 'Patient List',path: '/receptionist/patients',     icon: Users },
    { title: 'Reports',     path: '/receptionist/reports',      icon: BarChart2 },
  ],

  // ── PHARMACEUTICAL ────────────────────────────────────────────────────────
  pharmaceutical: [
    { title: 'Dashboard',   path: '/pharmaceutical/dashboard',  icon: LayoutDashboard },
    { title: 'New Sale',    path: '/pharmaceutical/sell',       icon: ShoppingCart },
    { title: 'Medicines',   path: '/pharmaceutical/medicines',  icon: Pill },
    { title: 'Stock & Sales',path: '/pharmaceutical/stock',     icon: Package },
    { title: 'Reports',     path: '/pharmaceutical/reports',    icon: BarChart2 },
  ],
};

// ── MOBILE BOTTOM NAV ─────────────────────────────────────────────────────
export const bottomNavConfig = {

  admin: [
    { title: 'Home',     path: '/admin/dashboard',     icon: LayoutDashboard },
    { title: 'Branches', path: '/admin/branches',       icon: Building2 },
    { title: 'Staff',    path: '/admin/clinic-staff',   icon: Users },
    { title: 'Reports',  path: '/admin/clinic-reports', icon: BarChart2 },
  ],

  receptionist: [
    { title: 'Home',        path: '/receptionist/dashboard',    icon: LayoutDashboard },
    { title: 'Appointments',path: '/receptionist/appointments', icon: Calendar },
    { title: 'Patients',    path: '/receptionist/patients',     icon: Users },
    { title: 'Reports',     path: '/receptionist/reports',      icon: BarChart2 },
  ],

  pharmaceutical: [
    { title: 'Home',     path: '/pharmaceutical/dashboard', icon: LayoutDashboard },
    { title: 'New Sale', path: '/pharmaceutical/sell',      icon: ShoppingCart },
    { title: 'Medicines',path: '/pharmaceutical/medicines', icon: Pill },
    { title: 'Reports',  path: '/pharmaceutical/reports',   icon: BarChart2 },
  ],
};
