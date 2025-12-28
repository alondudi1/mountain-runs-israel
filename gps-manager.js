/**
 * GPS Manager - גרסה עם דיבוג למסך
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
            alert("הדפדפן שלך לא תומך ב-GPS");
            return;
        }

        navigator.geolocation.watchPosition(
            (position) => {
                // הצלחה!
                this.currentLocation = [position.coords.latitude, position.coords.longitude];
                this.broadcast();
            },
            (error) => {
                // כאן התיקון: הצגת סיבת הכישלון למשתמש
                let msg = "שגיאת GPS לא ידועה";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "המשתמש או הדפדפן חסמו את הגישה למיקום. בדוק הגדרות פרטיות.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "המיקום לא זמין כרגע (נסה לצאת לשטח פתוח).";
                        break;
                    case error.TIMEOUT:
                        msg = "לקח יותר מדי זמן לקבל מיקום.";
                        break;
                }
                alert("תקלה: " + msg);
                console.warn("GPS Error: ", error.message);
            },
            { 
                enableHighAccuracy: true, 
                maximumAge: 0, 
                timeout: 10000 
            }
        );

        // האזנה למצפן
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientationabsolute', (event) => {
                if (event.alpha !== null) {
                    this.currentHeading = 360 - event.alpha;
                    this.broadcast();
                }
            }, true);
            
            window.addEventListener('deviceorientation', (event) => {
                if (event.webkitCompassHeading) {
                    this.currentHeading = event.webkitCompassHeading;
                } else if (event.alpha !== null && !event.absolute) {
                    this.currentHeading = 360 - event.alpha;
                }
                this.broadcast();
            }, true);
        }
    },

    // בקשת הרשאות (לאייפון)
    requestPermissions: async function() {
        // iOS 13+ דורש בקשה מפורשת למצפן
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.startTracking();
                } else {
                    alert("לא אישרת גישה לחיישני תנועה (מצפן).");
                    this.startTracking(); // ננסה בכל זאת GPS בלי מצפן
                }
            } catch (error) {
                console.error(error);
                this.startTracking();
            }
        } else {
            this.startTracking();
        }
    }
};
