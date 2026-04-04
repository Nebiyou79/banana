import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ChevronDownIcon } from 'lucide-react';

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  disabled?: boolean;
}

const CollapsibleContext = createContext<CollapsibleContextValue | undefined>(undefined);

const useCollapsible = () => {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('useCollapsible must be used within a Collapsible');
  }
  return context;
};

interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  children,
  className,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (newOpen: boolean) => {
    if (disabled) return;
    
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const contextValue: CollapsibleContextValue = {
    open,
    setOpen,
    disabled,
  };

  return (
    <CollapsibleContext.Provider value={contextValue}>
      <div className={cn('w-full', className)}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
};

interface CollapsibleTriggerProps {
  children: React.ReactElement; 
  className?: string;
  asChild?: boolean;
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({
  children,
  className,
  asChild = false,
}) => {
  const { open, setOpen, disabled } = useCollapsible();

  const toggleOpen = () => setOpen(!open);

  if (asChild) {
    return React.cloneElement(
      children,
      {
        onClick: toggleOpen,
        'data-state': open ? 'open' : 'closed',
        'aria-expanded': open,
        disabled,
      } as React.HTMLAttributes<HTMLElement>
    );
  }
}
interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  children,
  className,
}) => {
  const { open } = useCollapsible();

  return (
    <div
      data-state={open ? 'open' : 'closed'}
      className={cn(
        'overflow-hidden transition-all duration-200 ease-in-out',
        open ? 'animate-in fade-in-0' : 'animate-out fade-out-0',
        !open && 'hidden',
        className
      )}
    >
      {children}
    </div>
  );
};