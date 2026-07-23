import { Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from '../context/SidebarContext';
import { CommandPaletteProvider } from '../context/CommandPaletteContext';
import FloatingAssistantDock from '../components/common/FloatingAssistantDock';
import MobileNav from '../components/common/MobileNav';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import CommandPalette from '../components/common/CommandPalette';

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } },
};

function PageWrapper() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <CommandPaletteProvider>
        <div className="min-h-screen overflow-x-hidden bg-[#0A0A0A] text-white bg-mesh">
          <Sidebar />
          <CommandPalette />
          <div className="transition-all duration-300 lg:pl-72" id="main-content">
            <Navbar />
            <main className="mx-auto min-h-[calc(100vh-65px)] w-full min-w-0 max-w-7xl px-4 py-6 pb-28 sm:px-6 lg:px-8">
              <PageWrapper />
            </main>
          </div>
          <MobileNav />
          <FloatingAssistantDock />
        </div>
      </CommandPaletteProvider>
    </SidebarProvider>
  );
}
