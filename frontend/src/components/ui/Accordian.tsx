/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, createContext, useContext, useId } from 'react';
import { ChevronDown, Plus, Minus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============ CONTEXT ============
type AccordionContextType = {
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  type: 'single' | 'multiple';
  collapsible: boolean;
  disabled: boolean;
  variant: 'default' | 'outline' | 'filled' | 'ghost';
  size: 'sm' | 'md' | 'lg';
};

const AccordionContext = createContext<AccordionContextType | undefined>(undefined);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within Accordion');
  }
  return context;
};

// ============ MAIN ACCORDION COMPONENT ============
interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The type of accordion: single or multiple items can be open */
  type?: 'single' | 'multiple';
  /** The value(s) of the open item(s) in controlled mode */
  value?: string | string[];
  /** The default value(s) of the open item(s) in uncontrolled mode */
  defaultValue?: string | string[];
  /** Callback when value changes */
  onValueChange?: (value: string | string[]) => void;
  /** Whether the accordion is disabled */
  disabled?: boolean;
  /** Whether items can be collapsed when clicking on an open item */
  collapsible?: boolean;
  /** Visual variant of the accordion */
  variant?: 'default' | 'outline' | 'filled' | 'ghost';
  /** Size of the accordion items */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to allow multiple items open at once */
  allowMultiple?: boolean;
  /** Custom className for the accordion */
  className?: string;
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      className,
      type = 'single',
      value: controlledValue,
      defaultValue,
      onValueChange,
      disabled = false,
      collapsible = true,
      variant = 'default',
      size = 'md',
      allowMultiple = false,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = useState<string | string[]>(
      type === 'single' 
        ? defaultValue || '' 
        : Array.isArray(defaultValue) 
          ? defaultValue 
          : []
    );

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : uncontrolledValue;

    const handleValueChange = (itemValue: string) => {
      if (disabled) return;

      let newValue: string | string[];

      if (type === 'single' || !allowMultiple) {
        if (!collapsible && currentValue === itemValue) return;
        newValue = currentValue === itemValue ? '' : itemValue;
      } else {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        newValue = currentArray.includes(itemValue)
          ? currentArray.filter(v => v !== itemValue)
          : [...currentArray, itemValue];
      }

      if (!isControlled) {
        setUncontrolledValue(newValue);
      }

      onValueChange?.(newValue);
    };

    const isItemActive = (itemValue: string): boolean => {
      if (type === 'single' || !allowMultiple) {
        return currentValue === itemValue;
      } else {
        return Array.isArray(currentValue) && currentValue.includes(itemValue);
      }
    };

    return (
      <AccordionContext.Provider
        value={{
          value: currentValue,
          onValueChange: (value: string | string[]) => {
            if (typeof value === 'string') {
              handleValueChange(value);
            } else {
              // For multiple selection with external control
              if (!isControlled) {
                setUncontrolledValue(value);
              }
              onValueChange?.(value);
            }
          },
          type: type === 'single' || !allowMultiple ? 'single' : 'multiple',
          collapsible,
          disabled,
          variant,
          size,
        }}
      >
        <div
          ref={ref}
          className={cn('w-full space-y-2', className)}
          data-disabled={disabled}
          {...props}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);

Accordion.displayName = 'Accordion';

// ============ ACCORDION ITEM COMPONENT ============
interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Unique value for the accordion item */
  value: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Custom className for the item */
  className?: string;
  /** Custom className for the trigger */
  triggerClassName?: string;
  /** Custom className for the content */
  contentClassName?: string;
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  (
    {
      value,
      disabled = false,
      className,
      triggerClassName,
      contentClassName,
      children,
      ...props
    },
    ref
  ) => {
    const context = useAccordion();
    const isActive = context.type === 'single'
      ? context.value === value
      : Array.isArray(context.value) && typeof value === 'string' && context.value.includes(value);

    const itemDisabled = context.disabled || disabled;

    const variantStyles = {
      default: cn(
        'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800',
        'hover:border-gray-300 dark:hover:border-gray-700'
      ),
      outline: 'border border-gray-200 dark:border-gray-800 bg-transparent',
      filled: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
      ghost: cn(
        'bg-transparent border border-transparent',
        'hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-800'
      ),
    };

    const sizeStyles = {
      sm: 'rounded-md',
      md: 'rounded-lg',
      lg: 'rounded-xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden transition-all duration-200',
          variantStyles[context.variant],
          sizeStyles[context.size],
          {
            'ring-2 ring-primary/20 ring-offset-1': isActive && context.variant !== 'ghost',
            'opacity-50 pointer-events-none': itemDisabled,
            'cursor-pointer': !itemDisabled,
          },
          className
        )}
        data-state={isActive ? 'open' : 'closed'}
        data-disabled={itemDisabled}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            const childProps: any = { 
              value, 
              disabled: itemDisabled 
            };
            
            if (child.type === AccordionTrigger || (child as any).type?.displayName === 'AccordionTrigger') {
              return React.cloneElement(child, {
                ...(child.props as Record<string, any>),
                ...childProps,
                className: cn((child.props as any).className, triggerClassName),
              });
            }
            
            if (child.type === AccordionContent || (child as any).type?.displayName === 'AccordionContent') {
              return React.cloneElement(child, {
                ...(child.props as Record<string, any>),
                ...childProps,
                className: cn((child.props as any).className, contentClassName),
              });
            }
          }
          return child;
        })}
      </div>
    );
  }
);

AccordionItem.displayName = 'AccordionItem';

// ============ ACCORDION TRIGGER COMPONENT ============
interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Custom icon to replace the default */
  icon?: React.ReactNode;
  /** Position of the icon */
  iconPosition?: 'left' | 'right';
  /** Variant of the icon */
  iconVariant?: 'chevron' | 'plus' | 'arrow' | 'custom' | 'none';
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Custom className for the icon */
  iconClassName?: string;
  /** Whether to animate the icon */
  animateIcon?: boolean;
  /** Value prop from AccordionItem */
  value?: string;
  /** Whether the trigger is disabled */
  disabled?: boolean;
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  (
    {
      children,
      className,
      icon,
      iconPosition = 'right',
      iconVariant = 'chevron',
      showIcon = true,
      iconClassName,
      animateIcon = true,
      value,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const context = useAccordion();
    const triggerId = useId();
    
    const isActive = context.type === 'single'
      ? context.value === value
      : Array.isArray(context.value) && typeof value === 'string' && context.value.includes(value);

    const itemDisabled = context.disabled || disabled;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (itemDisabled || !value) return;
      context.onValueChange(value);
      onClick?.(e);
    };

    const sizePadding = {
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-5 py-4',
    };

    const iconSize = {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    };

    const renderIcon = () => {
      if (!showIcon || iconVariant === 'none') return null;
      
      if (icon) return icon;

      const baseClasses = cn(
        'transition-transform duration-300 ease-in-out',
        iconClassName,
        iconSize[context.size]
      );

      switch (iconVariant) {
        case 'plus':
          return isActive ? (
            <Minus className={cn(baseClasses, animateIcon && 'rotate-180')} />
          ) : (
            <Plus className={baseClasses} />
          );
        case 'arrow':
          return isActive ? (
            <ChevronDown className={cn(baseClasses, animateIcon && 'rotate-180')} />
          ) : (
            <ChevronRight className={baseClasses} />
          );
        case 'custom':
          return null;
        default: // chevron
          return (
            <ChevronDown
              className={cn(
                baseClasses,
                animateIcon && 'transition-transform duration-300 ease-in-out',
                animateIcon && isActive && 'rotate-180'
              )}
            />
          );
      }
    };

    return (
      <button
        ref={ref}
        id={`accordion-trigger-${triggerId}`}
        type="button"
        onClick={handleClick}
        disabled={itemDisabled}
        aria-expanded={isActive}
        aria-controls={`accordion-content-${triggerId}`}
        className={cn(
          'w-full flex items-center justify-between',
          'text-left font-medium transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2',
          'hover:bg-gray-50/50 dark:hover:bg-gray-800/50',
          sizePadding[context.size],
          {
            'bg-gray-50/50 dark:bg-gray-800/50': isActive,
            'cursor-not-allowed opacity-50': itemDisabled,
            'cursor-pointer': !itemDisabled,
          },
          className
        )}
        data-state={isActive ? 'open' : 'closed'}
        {...props}
      >
        {iconPosition === 'left' && renderIcon()}
        
        <div className="flex-1">{children}</div>
        
        {iconPosition === 'right' && renderIcon()}
      </button>
    );
  }
);

AccordionTrigger.displayName = 'AccordionTrigger';

// ============ ACCORDION CONTENT COMPONENT ============
interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to animate the content */
  animated?: boolean;
  /** Duration of the animation in milliseconds */
  animationDuration?: number;
  /** Force mount the content (useful for animations) */
  forceMount?: boolean;
  /** Value prop from AccordionItem */
  value?: string;
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  (
    {
      children,
      className,
      animated = true,
      animationDuration = 300,
      forceMount = false,
      value,
      ...props
    },
    ref
  ) => {
    const context = useAccordion();
    const contentId = useId();
    
    const isActive = context.type === 'single'
      ? context.value === value
      : Array.isArray(context.value) && typeof value === 'string' && context.value.includes(value);

    const sizePadding = {
      sm: 'px-3 pb-3 pt-1 text-sm',
      md: 'px-4 pb-4 pt-2',
      lg: 'px-5 pb-5 pt-3 text-lg',
    };

    if (!animated) {
      if (!isActive && !forceMount) return null;
      
      return (
        <div
          ref={ref}
          id={`accordion-content-${contentId}`}
          className={cn(
            'text-gray-600 dark:text-gray-300',
            sizePadding[context.size],
            className
          )}
          aria-labelledby={`accordion-trigger-${contentId}`}
          data-state={isActive ? 'open' : 'closed'}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        id={`accordion-content-${contentId}`}
        className="overflow-hidden"
        aria-labelledby={`accordion-trigger-${contentId}`}
        data-state={isActive ? 'open' : 'closed'}
        style={{
          animationDuration: `${animationDuration}ms`,
        }}
      >
        <div
          className={cn(
            'text-gray-600 dark:text-gray-300 transition-all duration-300 ease-in-out',
            sizePadding[context.size],
            isActive 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-2',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);

AccordionContent.displayName = 'AccordionContent';

// ============ PRE-BUILT VARIANTS ============
interface PresetAccordionProps extends Omit<AccordionProps, 'type' | 'variant' | 'size'> {
  children: React.ReactNode;
}

const FAQAccordion = React.forwardRef<HTMLDivElement, PresetAccordionProps>(
  ({ children, ...props }, ref) => {
    return (
      <Accordion
        ref={ref}
        type="single"
        variant="outline"
        collapsible={true}
        {...props}
      >
        {children}
      </Accordion>
    );
  }
);
FAQAccordion.displayName = 'FAQAccordion';

const SettingsAccordion = React.forwardRef<HTMLDivElement, PresetAccordionProps>(
  ({ children, ...props }, ref) => {
    return (
      <Accordion
        ref={ref}
        type="single"
        variant="filled"
        size="sm"
        collapsible={false}
        {...props}
      >
        {children}
      </Accordion>
    );
  }
);
SettingsAccordion.displayName = 'SettingsAccordion';

const NavigationAccordion = React.forwardRef<HTMLDivElement, PresetAccordionProps>(
  ({ children, ...props }, ref) => {
    return (
      <Accordion
        ref={ref}
        type="multiple"
        variant="ghost"
        size="sm"
        allowMultiple={true}
        {...props}
      >
        {children}
      </Accordion>
    );
  }
);
NavigationAccordion.displayName = 'NavigationAccordion';

// ============ EXPORTS ============
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  FAQAccordion,
  SettingsAccordion,
  NavigationAccordion,
};

export type {
  AccordionProps,
  AccordionItemProps,
  AccordionTriggerProps,
  AccordionContentProps,
};