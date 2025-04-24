import { collection, query, where, getDocs, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'Login_page.html';
        return;
    }

    const bookingsList = document.getElementById('bookingsList');
    const tabs = document.querySelectorAll('.tab');
    let currentTab = 'upcoming';

    // Add tab click handlers
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            loadBookings(currentTab);
        });
    });

    // Load initial bookings
    loadBookings('upcoming');

    async function loadBookings(type) {
        try {
            const bookingsRef = collection(window.db, "bookings");
            let q;
            const now = new Date();
            const today = now.toISOString().split('T')[0];

            switch(type) {
                case 'upcoming':
                    q = query(
                        bookingsRef,
                        where("userId", "==", user.id),
                        where("date", ">=", today),
                        where("status", "==", "active"),
                        orderBy("date", "asc")
                    );
                    break;
                case 'past':
                    q = query(
                        bookingsRef,
                        where("userId", "==", user.id),
                        where("date", "<", today),
                        orderBy("date", "desc")
                    );
                    break;
                case 'cancelled':
                    q = query(
                        bookingsRef,
                        where("userId", "==", user.id),
                        where("status", "==", "cancelled"),
                        orderBy("date", "desc")
                    );
                    break;
            }

            // Real-time listener for bookings
            onSnapshot(q, (snapshot) => {
                displayBookings(snapshot.docs);
            });

        } catch (error) {
            console.error("Error loading bookings:", error);
            bookingsList.innerHTML = '<p class="error-message">Error loading bookings. Please try again.</p>';
        }
    }

    function displayBookings(bookings) {
        if (!bookingsList) return;

        if (bookings.length === 0) {
            bookingsList.innerHTML = `<p class="no-bookings">No ${currentTab} bookings found.</p>`;
            return;
        }

        bookingsList.innerHTML = bookings.map(booking => {
            const data = booking.data();
            return `
                <div class="booking-card">
                    <div class="booking-header">
                        <h3 class="booking-title">${data.roomType}</h3>
                        <span class="booking-status status-${currentTab}">${currentTab}</span>
                    </div>
                    <div class="booking-details">
                        <div class="detail-item">
                            <span class="detail-label">Date</span>
                            <span class="detail-value">${formatDate(data.date)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Time</span>
                            <span class="detail-value">${data.startTime} - ${data.endTime}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Purpose</span>
                            <span class="detail-value">${data.purpose}</span>
                        </div>
                    </div>
                    ${currentTab === 'upcoming' ? `
                        <div class="booking-actions">
                            <button class="action-button modify-btn" onclick="modifyBooking('${booking.id}')">
                                Modify
                            </button>
                            <button class="action-button cancel-btn" onclick="cancelBooking('${booking.id}')">
                                Cancel
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    function formatDate(dateString) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Expose functions to window for onclick handlers
    window.modifyBooking = function(bookingId) {
        // Implement modification logic
        console.log('Modifying booking:', bookingId);
    };

    window.cancelBooking = async function(bookingId) {
        if (confirm('Are you sure you want to cancel this booking?')) {
            try {
                const bookingRef = doc(window.db, "bookings", bookingId);
                await updateDoc(bookingRef, {
                    status: 'cancelled'
                });
                loadBookings(currentTab);
            } catch (error) {
                console.error("Error cancelling booking:", error);
                alert('Error cancelling booking. Please try again.');
            }
        }
    };
});
