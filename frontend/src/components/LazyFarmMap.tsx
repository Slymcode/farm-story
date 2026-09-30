import { lazy, Suspense, Component, type ReactNode } from 'react';
import { MapPinOff } from 'lucide-react';
import { Skeleton } from './ui';

// Leaflet is code-split: the welcome screen and forms load without it (important on slow connections).
const FarmMap = lazy(() => import('./FarmMap'));
type Props = React.ComponentProps<typeof FarmMap>;

class MapBoundary extends Component<{ children: ReactNode; height: number }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ height: this.props.height }} className="grid place-items-center rounded-2xl border border-dashed border-cream-300 bg-cream-100 p-4 text-center text-ink-700">
        <div><MapPinOff className="mx-auto mb-2 size-6 text-earth-600" aria-hidden /><p className="font-medium">The map couldn't load.</p><p className="text-sm">You can still enter latitude and longitude manually.</p></div>
      </div>
    );
  }
}

export function LazyFarmMap(props: Props) {
  const h = props.height ?? 280;
  return (
    <MapBoundary height={h}>
      <Suspense fallback={<div style={{ height: h }}><Skeleton className="h-full w-full" /></div>}>
        <FarmMap {...props} />
      </Suspense>
    </MapBoundary>
  );
}
