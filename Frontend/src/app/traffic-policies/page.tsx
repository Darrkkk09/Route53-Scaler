import ComingSoon from '@/components/ComingSoon';
import { Route } from 'lucide-react';

export default function TrafficPoliciesPage() {
  return (
    <ComingSoon
      title="Traffic policies"
      description="Traffic policies let you create records in multiple hosted zones using a visual editor. Use them to route traffic based on latency, geolocation, failover, and more."
      icon={<Route className="w-8 h-8" />}
    />
  );
}
