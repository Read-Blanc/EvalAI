import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ClipboardList,
  TrendingUp,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

interface SidebarProps {
  role: "lecturer" | "student";
}

const lecturerNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/lecturer/dashboard" },
  {
    label: "Questions",
    icon: BookOpen,
    path: "/lecturer/questions",
    submenu: [
      { label: "Question Bank", path: "/lecturer/questions" },
      { label: "Create Question", path: "/lecturer/questions/new" }, // ✅ NEW
    ],
  },
  {
    label: "Assessments",
    icon: ClipboardList,
    path: "/lecturer/assessments", // ✅ NEW - ManageAssessments
    submenu: [
      { label: "All Assessments", path: "/lecturer/assessments" },
      { label: "Create Assessment", path: "/lecturer/assessments/create" },
    ],
  },
  { label: "Grading", icon: FileCheck, path: "/lecturer/grading" },
  { label: "Analytics", icon: BarChart3, path: "/lecturer/analytics" },
];
const studentNavItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/student/dashboard" },
  { label: "Assessments", icon: FileText, path: "/student/assessments" },
  { 
    label: "Results", 
    icon: CheckCircle2, 
    path: "/student/results",
    submenu: [
      { label: "All Submissions", path: "/student/results" },
      { label: "Performance", path: "/student/performance" },
    ]
  },
  { label: "Performance", icon: TrendingUp, path: "/student/performance" },
];

export function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navItems = role === "lecturer" ? lecturerNavItems : studentNavItems;
  const roleLabel =
    role === "lecturer" ? "Lecturer workspace" : "Student workspace";

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-card border-r border-border flex flex-col sticky top-0"
    >
      <div className="p-4 flex items-center justify-between border-b border-border">
        <Logo size="sm" showText={!collapsed} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-2"
          >
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {roleLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          to={`/${role}/settings`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-medium text-sm"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.aside>
  );
}
