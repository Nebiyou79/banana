// src/components/provider/MountedProvider.tsx
import { useEffect, useState } from 'react';

export default function MountedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <>{children}</>;
}
