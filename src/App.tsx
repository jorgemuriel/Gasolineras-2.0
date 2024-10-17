import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Search } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GasStation } from './types';

// Configurar el icono por defecto de Leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function SetViewOnClick({ coords }: { coords: [number, number] }) {
  const map = useMap();
  map.setView(coords, map.getZoom());
  return null;
}

function App() {
  const [gasStations, setGasStations] = useState<GasStation[]>([]);
  const [filteredStations, setFilteredStations] = useState<GasStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([40.4168, -3.7038]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGasStations = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://sedeaplicaciones.minetur.gob.es/ServiciosRESTCarburantes/PreciosCarburantes/EstacionesTerrestresHist/15-10-2024');
        setGasStations(response.data.ListaEESSPrecio);
        setFilteredStations(response.data.ListaEESSPrecio);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching gas stations:', error);
        setError('Error al cargar los datos de las gasolineras. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };

    fetchGasStations();
  }, []);

  useEffect(() => {
    const filtered = gasStations.filter(station =>
      station.Rótulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.Localidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.Provincia.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStations(filtered);
  }, [searchTerm, gasStations]);

  const handleStationSelect = (station: GasStation) => {
    setSelectedStation(station);
    setMapCenter([parseFloat(station.Latitud.replace(',', '.')), parseFloat(station['Longitud (WGS84)'].replace(',', '.'))]);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Cargando datos de gasolineras...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-screen">
      {/* Left side - List view */}
      <div className="w-1/3 p-4 overflow-y-auto">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar gasolinera..."
              className="w-full p-2 pl-10 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
        </div>
        <ul>
          {filteredStations.map((station) => (
            <li
              key={station.IDEESS}
              className="mb-2 p-2 border rounded cursor-pointer hover:bg-gray-100"
              onClick={() => handleStationSelect(station)}
            >
              <h3 className="font-bold">{station.Rótulo}</h3>
              <p>{station.Dirección}, {station.Localidad}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Right side - Map view */}
      <div className="w-2/3">
        <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {filteredStations.map((station) => (
            <Marker
              key={station.IDEESS}
              position={[parseFloat(station.Latitud.replace(',', '.')), parseFloat(station['Longitud (WGS84)'].replace(',', '.'))]}
              icon={defaultIcon}
            >
              <Popup>
                <h3 className="font-bold">{station.Rótulo}</h3>
                <p>{station.Dirección}, {station.Localidad}</p>
                <p>Gasolina 95: {station['Precio Gasolina 95 E5']} €</p>
                <p>Gasóleo A: {station['Precio Gasoleo A']} €</p>
              </Popup>
            </Marker>
          ))}
          <SetViewOnClick coords={mapCenter} />
        </MapContainer>
      </div>
    </div>
  );
}

export default App;