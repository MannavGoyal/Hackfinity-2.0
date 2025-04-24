import { collection, query, where, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase
    const db = window.db;

    // Get form elements
    const bookingForm = document.getElementById('bookingForm');
    const roomTypeSelect = document.getElementById('roomType');
    const dateInput = document.getElementById('dateInput');
    const startTime = document.getElementById('startTime');
    const endTime = document.getElementById('endTime');
    const purpose = document.getElementById('purpose');
    const roomPreview = document.querySelector('.room-preview');

    // Check if user is logged in
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'Login_page.html';
        return;
    }

    // Load available rooms
    loadAvailableRooms();

    async function loadAvailableRooms() {
        try {
            const roomsRef = collection(db, "rooms");
            const q = query(roomsRef, where("status", "==", "active"));
            const querySnapshot = await getDocs(q);

            // Clear existing options
            roomTypeSelect.innerHTML = '<option value="">Select a Room</option>';

            // Add rooms to select
            querySnapshot.forEach((doc) => {
                const room = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${room.name} (${room.type}) - Capacity: ${room.capacity}`;
                roomTypeSelect.appendChild(option);
            });

            // Add change event listener
            roomTypeSelect.addEventListener('change', updateRoomPreview);
        } catch (error) {
            console.error("Error loading rooms:", error);
            alert('Error loading rooms. Please try again.');
        }
    }

    async function updateRoomPreview() {
        if (!roomPreview || !roomTypeSelect.value) return;

        try {
            const roomRef = doc(db, "rooms", roomTypeSelect.value);
            const roomDoc = await getDoc(roomRef);
            
            if (roomDoc.exists()) {
                const room = roomDoc.data();
                roomPreview.innerHTML = `
                    <h3>Room Details</h3>
                    <p><strong>Name:</strong> ${room.name}</p>
                    <p><strong>Type:</strong> ${room.type}</p>
                    <p><strong>Capacity:</strong> ${room.capacity} people</p>
                    <p><strong>Facilities:</strong> ${room.facilities.join(', ')}</p>
                `;
            }
        } catch (error) {
            console.error("Error loading room details:", error);
        }
    }

    // Form submission
    bookingForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        try {
            const formData = {
                roomId: roomTypeSelect.value,
                roomType: roomTypeSelect.options[roomTypeSelect.selectedIndex].text,
                date: dateInput.value,
                startTime: startTime.value,
                endTime: endTime.value,
                purpose: purpose.value,
                bookedBy: user.fullName,
                userId: user.id,
                userRole: user.role,
                department: user.department,
                bookingTime: new Date().toISOString(),
                status: 'active'
            };

            // Validate time
            if (startTime.value >= endTime.value) {
                alert('End time must be after start time');
                return;
            }

            // Check for booking conflicts
            const conflicts = await checkBookingConflicts(formData);
            if (conflicts) {
                alert('This time slot is already booked. Please choose another time.');
                return;
            }

            // Add booking to Firebase
            const docRef = await addDoc(collection(db, "bookings"), formData);
            alert('Booking successful!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error("Error adding booking:", error);
            alert('Error making booking. Please try again.');
        }
    });

    async function checkBookingConflicts(newBooking) {
        const bookingsRef = collection(db, "bookings");
        const q = query(
            bookingsRef,
            where("roomId", "==", newBooking.roomId),
            where("date", "==", newBooking.date),
            where("status", "==", "active")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.some(doc => {
            const booking = doc.data();
            return (
                (newBooking.startTime < booking.endTime && 
                 newBooking.endTime > booking.startTime)
            );
        });
    }

    // Time input validation
    startTime.addEventListener('change', validateTimes);
    endTime.addEventListener('change', validateTimes);

    function validateTimes() {
        if (startTime.value && endTime.value) {
            if (startTime.value >= endTime.value) {
                endTime.setCustomValidity('End time must be after start time');
            } else {
                endTime.setCustomValidity('');
            }
        }
    }
});
