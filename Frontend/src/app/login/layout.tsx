import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Sign In — Amazon Route 53',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
