import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const buildingFilter = document.getElementById('buildingFilter');
    const roomTypeFilter = document.getElementById('roomTypeFilter');
    const dateFilter = document.getElementById('dateFilter');
    const timeFilter = document.getElementById('timeFilter');
    const roomGrid = document.getElementById('roomGrid');

    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateFilter.value = today;
    dateFilter.min = today;

    // Add event listeners to filters
    [buildingFilter, roomTypeFilter, dateFilter, timeFilter].forEach(filter => {
        filter.addEventListener('change', loadRooms);
    });

    // Initial load
    loadRooms();

    async function loadRooms() {
        try {
            roomGrid.innerHTML = '<div class="loading">Loading rooms...</div>';

            const selectedDate = dateFilter.value;
            const selectedBuilding = buildingFilter.value;
            const selectedType = roomTypeFilter.value;
            const selectedTime = timeFilter.value;

            // Get all rooms
            const rooms = await getRooms();
            
            // Get bookings for the selected date
            const bookings = await getBookings(selectedDate);

            // Filter rooms based on criteria
            const filteredRooms = rooms.filter(room => {
                if (selectedBuilding && room.building !== selectedBuilding) return false;
                if (selectedType && room.type !== selectedType) return false;
                return true;
            });

            if (filteredRooms.length === 0) {
                roomGrid.innerHTML = '<div class="no-rooms">No rooms match your criteria</div>';
                return;
            }

            // Display rooms
            roomGrid.innerHTML = filteredRooms.map(room => {
                const roomBookings = bookings.filter(b => b.roomType === room.type);
                const availability = checkAvailability(roomBookings, selectedTime);
                return createRoomCard(room, availability, roomBookings);
            }).join('');

        } catch (error) {
            console.error("Error loading rooms:", error);
            roomGrid.innerHTML = '<div class="error">Error loading rooms. Please try again.</div>';
        }
    }

    async function getRooms() {
        // In a real application, this would fetch from Firebase
        // For now, returning dummy data
        return [
            {
                id: 1,
                type: 'classroom',
                building: 'main',
                name: 'Classroom 101',
                capacity: 30,
                facilities: ['Projector', 'Whiteboard', 'AC']
            },
            {
                id: 2,
                type: 'lab',
                building: 'science',
                name: 'Computer Lab A',
                capacity: 40,
                facilities: ['Computers', 'Projector', 'AC']
            },
            // Add more rooms as needed
        ];
    }

    async function getBookings(date) {
        try {
            const bookingsRef = collection(window.db, "bookings");
            const q = query(bookingsRef, where("date", "==", date));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error("Error fetching bookings:", error);
            return [];
        }
    }

    function checkAvailability(bookings, timeFilter) {
        if (bookings.length === 0) return true;

        // If no time filter, check if there are any bookings
        if (!timeFilter) return bookings.length === 0;

        // Check availability based on time filter
        const timeRanges = {
            morning: { start: '08:00', end: '12:00' },
            afternoon: { start: '12:00', end: '16:00' },
            evening: { start: '16:00', end: '20:00' }
        };

        const range = timeRanges[timeFilter];
        if (!range) return true;

        return !bookings.some(booking => 
            booking.startTime < range.end && booking.endTime > range.start
        );
    }

    function createRoomCard(room, isAvailable, bookings) {
        const timeSlots = generateTimeSlots(bookings);
        
        return `
            <div class="room-card">
                <div class="room-image"></div>
                <div class="room-details">
                    <h3 class="room-type">${room.name}</h3>
                    <div class="room-info">
                        <p>Building: ${room.building}</p>
                        <p>Capacity: ${room.capacity} people</p>
                        <p>Facilities: ${room.facilities.join(', ')}</p>
                    </div>
                    <span class="availability-status status-${isAvailable ? 'available' : 'occupied'}">
                        ${isAvailable ? 'Available' : 'Occupied'}
                    </span>
                    <div class="time-slots">
                        ${timeSlots}
                    </div>
                    <button 
                        class="book-button" 
                        onclick="window.location.href='book-room.html?room=${room.id}'"
                        ${!isAvailable ? 'disabled' : ''}
                    >
                        ${isAvailable ? 'Book Now' : 'Not Available'}
                    </button>
                </div>
            </div>
        `;
    }

    function generateTimeSlots(bookings) {
        const slots = [
            { time: '8 AM - 12 PM', key: 'morning' },
            { time: '12 PM - 4 PM', key: 'afternoon' },
            { time: '4 PM - 8 PM', key: 'evening' }
        ];

        return slots.map(slot => {
            const isBooked = bookings.some(booking => {
                const bookingStart = booking.startTime;
                const bookingEnd = booking.endTime;
                // Add logic to check if booking overlaps with this slot
                return true; // Simplified for now
            });

            return `
                <div class="time-slot ${isBooked ? 'booked' : 'available'}">
                    ${slot.time}
                </div>
            `;
        }).join('');
    }
});

function bookRoom(roomId) {
    // Redirect to booking page with room ID
    window.location.href = `book-room.html?room=${roomId}`;
}
