// /src/components/layouts/Layout.tsx
import Navbar from "./Navbar";
import { colors } from '@/utils/color';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: colors.gray100 }}>
      <Navbar />
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 container mx-auto px-6 py-4">{children}</main>
      </div>
    </div>
  );
}