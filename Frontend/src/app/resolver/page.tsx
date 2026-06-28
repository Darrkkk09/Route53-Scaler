import ComingSoon from '@/components/ComingSoon';
import { Network } from 'lucide-react';

export default function ResolverPage() {
  return (
    <ComingSoon
      title="Resolver"
      description="Route 53 Resolver is a regional DNS service that routes DNS queries between VPCs and your on-premises network. Supports inbound and outbound endpoints."
      icon={<Network className="w-8 h-8" />}
    />
  );
}
