export function getMaps() {
  // Native-only require to avoid web bundling
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const m: any = require('react-native-maps');
  return { MapView: m.default || m.MapView, Marker: m.Marker } as {
    MapView: any;
    Marker: any;
  };
}
