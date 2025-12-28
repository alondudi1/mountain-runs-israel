/**
 * GPS Manager - מנוע איסוף נתוני מיקום וכיוון
 */
const GPSManager = {
    currentLocation: null,
    currentHeading: null,
    callbacks: [],

    // רישום פונקציות שיקבלו עדכונים
    onUpdate: function(callback) {
        this.callbacks.push(callback);
    },

    // שליחת עדכון לכל מי שמקשיב
    broadcast: function() {
        this.callbacks.forEach(cb => cb({
            latlng: this.currentLocation,
            heading: this.currentHeading
        }));
    },

    // התחלת מעקב מיקום
    startTracking: function() {
        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.watchPosition(
            (position) => {
                this.currentLocation = [position.coords.latitude, position.coords.longitude];
                this.broadcast();
            },
            (error) => console.warn("GPS Error: ", error.message),
            { enableHighAccuracy: true, maximumAge: 1000 }
        );

        // האזנה למצפן (כיוון המכשיר)
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientationabsolute', (event) => {
                // עבור אנדרואיד
                if (event.alpha !== null) {
                    this.currentHeading = 360 - event.alpha;
                    this.broadcast();
                }
            }, true);
            
            window.addEventListener('deviceorientation', (event) => {
                // עבור iOS (אם זמין)
                if (event.webkitCompassHeading) {
                    this.currentHeading = event.webkitCompassHeading;
                } else if (event.alpha !== null && !event.absolute) {
                    this.currentHeading = 360 - event.alpha;
                }
                this.broadcast();
            }, true);
        }
    },

    // בקשת הרשאות (נדרש במיוחד ב-iOS)
    requestPermissions: async function() {
        // בדיקת הרשאת מצפן ל-iOS
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.startTracking();
                }
            } catch (error) {
                console.error("Permission request failed", error);
            }
        } else {
            // דפדפנים רגילים (אנדרואיד ומחשב)
            this.startTracking();
        }
    }
};
