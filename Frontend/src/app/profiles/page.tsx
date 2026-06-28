import ComingSoon from '@/components/ComingSoon';
import { Shield } from 'lucide-react';

export default function ProfilesPage() {
  return (
    <ComingSoon
      title="Profiles"
      description="Route 53 Profiles allow you to apply a consistent set of Route 53 configurations across multiple VPCs and accounts in the same AWS region."
      icon={<Shield className="w-8 h-8" />}
    />
  );
}
