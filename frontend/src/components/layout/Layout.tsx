import Navbar from "./Navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
            <Navbar />
        <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-6 py-4">{children}</main>
    </div>
    </div>

  );
}
