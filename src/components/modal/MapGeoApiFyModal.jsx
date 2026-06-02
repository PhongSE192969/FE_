import {MapContainer, TileLayer, Marker, useMap, useMapEvents} from "react-leaflet";
import {useState, useEffect} from "react";
import iconGPS from "/gps.png";

// ================= CLICK MAP =================
function MapClickHandler({setTempLocation, setPosition}) {
    const map = useMapEvents({
        click(e) {
            const {lat, lng} = e.latlng;

            const newPos = [lat, lng];
            setPosition(newPos);
            setTempLocation({lat, lng});

            map.flyTo(newPos, 16, {duration: 1.5});
        }
    });

    return null;
}

function FixMapSize() {
    const map = useMap();

    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, []);

    return null;
}

function FlyToLocation({position}) {
    const map = useMap();

    useEffect(() => {
        if (position) {
            map.flyTo(position, 16, {duration: 1.5});
        }
    }, [position]);

    return null;
}

// ================= GPS BUTTON =================
function LocateButton({setPosition, setTempLocation}) {
    const map = useMap();
    const handleLocate = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;

            const newPos = [lat, lng];

            setPosition(newPos);
            setTempLocation({lat, lng});

            map.flyTo(newPos, 16, { duration: 1.5});
        });
    };

    return (
        <button onClick={handleLocate}
                className="absolute w-12 h-12 bottom-4 right-4 z-[1000] bg-white rounded-lg shadow">
            <img src={iconGPS}/>
        </button>
    );

}

// ================= MAIN MODAL =================
export default function MapGeoApiFyModal({onSelectLocation, onClose}) {

    const [position, setPosition] = useState(null);
    const [tempLocation, setTempLocation] = useState(null);
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                const newPos = [lat, lng];

                setPosition(newPos);
                setTempLocation({lat, lng});
            },
            () => {
                console.warn("User denied GPS");
            }
        );
    }, []);
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white w-[800px] h-[550px] rounded-xl relative p-4">
                {/* CLOSE */}
                <button onClick={onClose} className="absolute top-2 right-2 z-[1000]">
                    ✕
                </button>

                {/* MAP */}
                <MapContainer
                    center={[10.7769, 106.7009]}
                    zoom={13}
                    className="w-full h-[420px]"
                >
                    <FixMapSize/>
                    <FlyToLocation position={position}/>
                    <TileLayer
                        url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=be404ab39aa94ae2bd00133e5add65a3`}
                    />
                    <LocateButton
                        setPosition={setPosition}
                        setTempLocation={setTempLocation}
                    />
                    <MapClickHandler
                        setPosition={setPosition}
                        setTempLocation={setTempLocation}
                    />
                    {position && <Marker position={position}/>}
                </MapContainer>
                {/* ACTION */}
                <div className="flex justify-end mt-3 gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded"
                    >
                        Hủy
                    </button>

                    <button
                        disabled={!tempLocation}
                        onClick={() => onSelectLocation(tempLocation)}
                        className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
                    >
                        Xác nhận
                    </button>
                </div>

            </div>
        </div>
    );
}
