// components/layout/HomeLayout.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';

interface HomeLayoutProps {
    children: React.ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Auto-close sidebar on mobile
            if (mobile) {
                setSidebarOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close sidebar when route changes on mobile
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [isMobile]);

    return (
        <div className="min-h-screen bg-white">
            <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Mobile Sidebar - Only show when user is logged in */}
            {isAuthenticated && user && sidebarOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm transition-all duration-300"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                        onClick={() => setSidebarOpen(false)}
                    />

                    {/* Sidebar */}
                    <div
                        className="fixed inset-y-0 left-0 w-80 z-50 lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl"
                        style={{
                            backgroundColor: 'white',
                            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
                        }}
                    >
                        <Sidebar onClose={() => setSidebarOpen(false)} />
                    </div>
                </>
            )}

            {/* Main Content */}
            <main>
                {children}
            </main>

            <Footer />
        </div>
    );
}