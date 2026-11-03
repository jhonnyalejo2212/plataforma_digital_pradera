import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

const variants = {
  primary: "bg-brand-700 text-white",
  secondary: "border-line bg-white text-brand-800",
  ghost: "flex-row-reverse bg-transparent px-1 text-brand-700",
  dark: "bg-white text-brand-950",
  whatsapp: "bg-whatsapp text-white",
} as const;

type Common = {
  variant?: keyof typeof variants;
  icon?: IconName;
  iconOnlyOnMobile?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonProps = Common & ({ href: string } & Omit<ComponentProps<typeof Link>, "href" | keyof Common> | ({ href?: undefined } & Omit<ComponentProps<"button">, keyof Common>));

export function Button({ variant = "primary", icon, iconOnlyOnMobile, children, className, ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center gap-[9px] whitespace-nowrap rounded-[10px] border border-transparent px-5 text-sm font-bold transition hover:-translate-y-px hover:shadow-soft",
    variants[variant],
    iconOnlyOnMobile && "max-md:w-12 max-md:min-w-12 max-md:px-0",
    className,
  );
  const content = (
    <>
      {icon && <Icon name={icon} size={18} />}
      <span className={iconOnlyOnMobile ? "max-md:hidden" : undefined}>{children}</span>
    </>
  );
  if (props.href !== undefined) {
    return <Link {...(props as ComponentProps<typeof Link>)} className={classes}>{content}</Link>;
  }
  const { type = "button", ...rest } = props as ComponentProps<"button">;
  return <button type={type} {...rest} className={classes}>{content}</button>;
}
