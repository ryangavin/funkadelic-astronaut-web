import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './PosterButton.css';

type CommonProps = {
  children: ReactNode;
  tone?: 'coral' | 'mint';
};

type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type LinkProps = CommonProps & {
  href: string;
  onClick?: () => void;
};

export type PosterButtonProps = ButtonProps | LinkProps;

export function PosterButton({ children, tone = 'coral', ...props }: PosterButtonProps) {
  const className = `poster-button poster-button--${tone}`;

  if ('href' in props && props.href) {
    return (
      <a className={className} href={props.href} onClick={props.onClick}>
        {children}
      </a>
    );
  }

  return (
    <button className={className} type="button" {...props}>
      {children}
    </button>
  );
}
