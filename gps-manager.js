/**
 * GPS Manager - גרסה פסיבית (ללא הפעלה אוטומטית)
 */
const GPSManager = {
    currentLocation: null,
    currentHeading: null,
    callbacks: [],
    isTracking: false, // מוודא שלא נפעיל פעמיים סתם

    // רישום פונקציות שיקבלו עדכונים (כמו המרקר במפה)
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

    // הפונקציה הזו מופעלת רק אחרי שהמשתמש לחץ על הכפתור ואישר
    startTracking: function() {
        if (this.isTracking) return; // אם כבר עוקב, לא לעשות כלום
        
        if (!navigator.geolocation) {
            alert("הדפדפן שלך לא תומך ב-GPS");
            return;
        }

        this.isTracking = true;

        navigator.geolocation.watchPosition(
            (position) => {
                this.currentLocation = [position.coords.latitude, position.coords.longitude];
                this.broadcast();
            },
            (error) => {
                // טיפול בשגיאות רק אם המשתמש יזם את הבקשה
                let msg = "שגיאת מיקום כללית";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "הגישה למיקום נחסמה. בדוק הגדרות דפדפן.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "המיקום לא זמין כרגע.";
                        break;
                    case error.TIMEOUT:
                        msg = "הקליטה חלשה מדי.";
                        break;
                }
                console.warn("GPS Warning:", msg);
                // הערה: הסרתי את ה-alert מכאן כדי שלא יציק אם הקליטה נעלמת לרגע
            },
            { 
                enableHighAccuracy: true, 
                maximumAge: 0, 
                timeout: 10000 
            }
        );

        // האזנה למצפן (רק אם המכשיר תומך)
        if (window.DeviceOrientationEvent) {
            const handleOrientation = (event) => {
                let heading = null;
                if (event.webkitCompassHeading) {
                    heading = event.webkitCompassHeading; // אייפון
                } else if (event.alpha !== null) {
                    heading = 360 - event.alpha; // אנדרואיד
                }
                
                if (heading !== null) {
                    this.currentHeading = heading;
                    this.broadcast();
                }
            };

            window.addEventListener('deviceorientationabsolute', handleOrientation, true);
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    },

    // זו הפונקציה שהכפתור קורא לה
    requestPermissions: async function() {
        // iOS 13+ דורש בקשה מפורשת למצפן
        if (typeof DeviceOrientationEvent !== 'undefined' && 
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    this.startTracking();
                } else {
                    alert("לא אישרת גישה למצפן, ננסה מיקום בלבד.");
                    this.startTracking();
                }
            } catch (error) {
                console.error(error);
                this.startTracking();
            }
        } else {
            // מכשירים רגילים (לא אייפון חדש) - ישר מפעילים
            this.startTracking();
        }
    }
};

// חשוב מאוד: אין כאן שורה שמפעילה את GPSManager.startTracking()
// ההפעלה תתבצע רק דרך route.html בלחיצה על הכפתור
