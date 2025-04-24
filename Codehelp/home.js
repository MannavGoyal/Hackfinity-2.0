import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // Get references to elements
    const todayBookingsCount = document.querySelector('.stat-card:first-child .stat-number');
    const availableRoomsCount = document.querySelector('.stat-card:nth-child(2) .stat-number');
    const schedulePreview = document.querySelector('.schedule-preview');
    const activityList = document.querySelector('.activity-list');

    // Check if user is logged in
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'Login_page.html';
        return;
    }

    // Initialize
    updateDashboard();
    setupRealtimeListeners();

    async function updateDashboard() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const bookingsRef = collection(window.db, "bookings");
            
            // Query for today's bookings
            const todayQuery = query(
                bookingsRef,
                where("date", "==", today),
                orderBy("startTime", "asc")
            );

            // Get today's bookings
            const todaySnapshot = await getDocs(todayQuery);
            const todayBookings = todaySnapshot.docs;

            // Update statistics
            updateStatistics(todayBookings);

            // Update schedule preview
            updateSchedulePreview(todayBookings);

        } catch (error) {
            console.error("Error updating dashboard:", error);
            if (schedulePreview) {
                schedulePreview.innerHTML = '<div class="error-message">Error loading schedule. Please try again.</div>';
            }
        }
    }

    function updateStatistics(todayBookings) {
        // Update today's bookings count
        if (todayBookingsCount) {
            todayBookingsCount.textContent = todayBookings.length;
        }

        // For now, set available rooms to a default of total rooms minus booked rooms
        const totalRooms = 20; // You can adjust this number
        const bookedRooms = new Set(todayBookings.map(doc => doc.data().roomType)).size;
        if (availableRoomsCount) {
            availableRoomsCount.textContent = totalRooms - bookedRooms;
        }
    }

    function updateSchedulePreview(bookings) {
        if (!schedulePreview) return;

        // Sort bookings by start time
        const sortedBookings = bookings.sort((a, b) => {
            const timeA = a.data().startTime;
            const timeB = b.data().startTime;
            return timeA.localeCompare(timeB);
        });

        if (sortedBookings.length === 0) {
            schedulePreview.innerHTML = '<div class="no-bookings">No bookings for today</div>';
            return;
        }

        schedulePreview.innerHTML = sortedBookings.map(booking => {
            const data = booking.data();
            return `
                <div class="schedule-item">
                    <div class="schedule-time">${data.startTime} - ${data.endTime}</div>
                    <div class="schedule-details">
                        <div class="schedule-room">${data.roomType}</div>
                        <div class="schedule-purpose">${data.purpose}</div>
                        <div class="schedule-booked-by">Booked by: ${data.bookedBy}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function setupRealtimeListeners() {
        const bookingsRef = collection(window.db, "bookings");
        
        // Listen for new bookings
        const recentQuery = query(
            bookingsRef,
            orderBy("bookingTime", "desc"),
            limit(5)
        );

        onSnapshot(recentQuery, (snapshot) => {
            updateActivityList(snapshot.docChanges());
        });
    }

    function updateActivityList(changes) {
        if (!activityList) return;

        changes.forEach(change => {
            if (change.type === "added") {
                const data = change.doc.data();
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                
                // Calculate time ago
                const timeAgo = getTimeAgo(new Date(data.bookingTime));

                activityItem.innerHTML = `
                    <span class="activity-icon">🔒</span>
                    <span class="activity-text">${data.roomType} booked for ${data.purpose}</span>
                    <span class="activity-time">${timeAgo}</span>
                `;

                // Add new activity at the top
                activityList.insertBefore(activityItem, activityList.firstChild);

                // Remove oldest activity if more than 3
                if (activityList.children.length > 3) {
                    activityList.removeChild(activityList.lastChild);
                }
            }
        });
    }

    function getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
});
