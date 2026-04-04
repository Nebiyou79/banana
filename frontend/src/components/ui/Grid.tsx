/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode, CSSProperties } from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import Grid from '@mui/material/GridLegacy';

interface GridItemProps {
  children: ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  sx?: SxProps<Theme>;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

type ResponsiveValue<T> =
  | T
  | {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
  };

interface GridContainerProps {
  children: ReactNode;
  spacing?: number;
  sx?: SxProps<Theme>;
  className?: string;
  alignItems?: ResponsiveValue<'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'>;
  justifyContent?: ResponsiveValue<
    'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
  >;
  direction?: ResponsiveValue<'row' | 'row-reverse' | 'column' | 'column-reverse'>;
  wrap?: ResponsiveValue<'nowrap' | 'wrap' | 'wrap-reverse'>;
  style?: CSSProperties;
  gap?: number | string;
}

/* =========================
   Grid Container
========================= */
export const GridContainer: React.FC<GridContainerProps> = ({
  children,
  spacing = 3,
  sx,
  className,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  direction = 'row',
  wrap = 'wrap',
  style,
  gap,
}) => {
  return (
    <Grid
      container
      spacing={spacing}
      alignItems={alignItems as any}
      justifyContent={justifyContent as any}
      direction={direction as any}
      wrap={wrap as any}
      sx={{
        ...(gap ? { gap } : {}),
        ...sx,
      }}
      className={className}
      style={style}
    >
      {children}
    </Grid>
  );
};

/* =========================
   Grid Item
========================= */
export const GridItem: React.FC<GridItemProps> = ({
  children,
  xs = 12,
  sm,
  md,
  lg,
  xl,
  sx,
  className,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  return (
    <Grid
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      sx={sx}
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </Grid>
  );
};

/* =========================
   Form Helpers
========================= */
export const FormGrid: React.FC<GridContainerProps> = (props) => (
  <GridContainer spacing={3} {...props} />
);

export const FormField: React.FC<GridItemProps> = (props) => (
  <GridItem xs={12} {...props} />
);

/* =========================
   Responsive Grid
========================= */
export const ResponsiveGrid: React.FC<{
  items: ReactNode[];
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  sx?: SxProps<Theme>;
  style?: CSSProperties;
  className?: string;
}> = ({
  items,
  xs = 12,
  sm = 6,
  md = 4,
  lg = 3,
  xl = 2,
  spacing = 3,
  sx,
  style,
  className,
}) => {
    return (
      <GridContainer spacing={spacing} sx={sx} style={style} className={className}>
        {items.map((item, index) => (
          <GridItem key={index} xs={xs} sm={sm} md={md} lg={lg} xl={xl}>
            {item}
          </GridItem>
        ))}
      </GridContainer>
    );
  };

/* =========================
   Split Grid
========================= */
export const SplitGrid: React.FC<{
  left: ReactNode;
  right: ReactNode;
  leftSize?: number;
  rightSize?: number;
  spacing?: number;
  sx?: SxProps<Theme>;
  style?: CSSProperties;
  className?: string;
  reverseOnMobile?: boolean;
}> = ({
  left,
  right,
  leftSize = 6,
  rightSize = 6,
  spacing = 3,
  sx,
  style,
  className,
  reverseOnMobile = false,
}) => {
    return (
      <GridContainer
        spacing={spacing}
        sx={sx}
        style={style}
        className={className}
        direction={reverseOnMobile ? { xs: 'column-reverse', md: 'row' } : 'row'}
      >
        <GridItem xs={12} md={leftSize}>
          {left}
        </GridItem>
        <GridItem xs={12} md={rightSize}>
          {right}
        </GridItem>
      </GridContainer>
    );
  };

/* =========================
   Utility
========================= */
export const span = (value: number) => ({
  xs: value,
  sm: value,
  md: value,
  lg: value,
  xl: value,
});

export const breakpoints = {
  xs: (value: number) => ({ xs: value }),
  sm: (value: number) => ({ sm: value }),
  md: (value: number) => ({ md: value }),
  lg: (value: number) => ({ lg: value }),
  xl: (value: number) => ({ xl: value }),
};

export default {
  Container: GridContainer,
  Item: GridItem,
  Form: FormGrid,
  Field: FormField,
  Responsive: ResponsiveGrid,
  Split: SplitGrid,
  span,
  breakpoints,
};
