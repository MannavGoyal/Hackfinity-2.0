import { collection, query, getDocs, addDoc, onSnapshot, orderBy, limit, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables
    const db = window.db;
    let utilizationChart = null;
    let departmentChart = null;

    // Check if user is logged in and is admin
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'Login_page.html';
        return;
    }

    // Initialize everything
    initializeCharts();
    loadStatistics();
    setupRoomManagement();
    setupActivityLog();

    // Initialize Charts
    function initializeCharts() {
        // Room Utilization Chart
        const utilizationCtx = document.getElementById('utilizationChart').getContext('2d');
        utilizationChart = new Chart(utilizationCtx, {
            type: 'line',
            data: {
                labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                datasets: [{
                    label: 'Room Utilization %',
                    data: [65, 75, 85, 70, 80],
                    borderColor: '#003366',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Department Bookings Chart
        const departmentCtx = document.getElementById('departmentChart').getContext('2d');
        departmentChart = new Chart(departmentCtx, {
            type: 'doughnut',
            data: {
                labels: ['Science', 'Engineering', 'Arts', 'Management'],
                datasets: [{
                    data: [30, 25, 20, 25],
                    backgroundColor: [
                        '#003366',
                        '#004d99',
                        '#0066cc',
                        '#0080ff'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Load Statistics
    async function loadStatistics() {
        try {
            const bookingsRef = collection(db, "bookings");
            const bookingsSnapshot = await getDocs(bookingsRef);
            
            // Update statistics
            document.getElementById('totalBookings').textContent = bookingsSnapshot.size;
            document.getElementById('activeRooms').textContent = '15'; // Replace with actual count
            document.getElementById('totalUsers').textContent = '150'; // Replace with actual count
            document.getElementById('utilizationRate').textContent = '75%'; // Calculate based on bookings

            // Update charts with real data
            updateCharts(bookingsSnapshot.docs);
        } catch (error) {
            console.error("Error loading statistics:", error);
        }
    }

    // Update Charts with real data
    function updateCharts(bookings) {
        // Update utilization chart
        const utilizationData = calculateUtilizationData(bookings);
        utilizationChart.data.datasets[0].data = utilizationData;
        utilizationChart.update();

        // Update department chart
        const departmentData = calculateDepartmentData(bookings);
        departmentChart.data.datasets[0].data = departmentData;
        departmentChart.update();
    }

    function calculateUtilizationData(bookings) {
        // Calculate daily utilization
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        return days.map(day => {
            // Calculate utilization for each day
            return Math.floor(Math.random() * 30) + 60; // Replace with actual calculation
        });
    }

    function calculateDepartmentData(bookings) {
        // Calculate bookings per department
        return [30, 25, 20, 25]; // Replace with actual calculation
    }

    // Room Management
    function setupRoomManagement() {
        const addRoomForm = document.getElementById('addRoomForm');
        if (addRoomForm) {
            addRoomForm.addEventListener('submit', handleAddRoom);
        }

        // Load existing rooms
        loadRooms();
    }

    async function loadRooms() {
        try {
            const roomList = document.getElementById('roomList');
            if (!roomList) return;

            const roomsRef = collection(db, "rooms");
            const snapshot = await getDocs(roomsRef);

            roomList.innerHTML = snapshot.docs.map(doc => {
                const room = doc.data();
                return `
                    <div class="room-card">
                        <h3>${room.name}</h3>
                        <p>Type: ${room.type}</p>
                        <p>Capacity: ${room.capacity}</p>
                        <p>Facilities: ${room.facilities.join(', ')}</p>
                        <div class="room-actions">
                            <button onclick="editRoom('${doc.id}')" class="edit-btn">Edit</button>
                            <button onclick="deleteRoom('${doc.id}')" class="delete-btn">Delete</button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error("Error loading rooms:", error);
        }
    }

    async function handleAddRoom(e) {
        e.preventDefault();
        
        try {
            const formData = {
                name: document.getElementById('roomName').value,
                type: document.getElementById('roomType').value,
                capacity: parseInt(document.getElementById('capacity').value),
                facilities: Array.from(document.querySelectorAll('input[name="facilities"]:checked'))
                    .map(cb => cb.value),
                status: 'active',
                addedBy: user.id,
                addedAt: new Date().toISOString()
            };

            // Add room to Firebase
            const docRef = await addDoc(collection(db, "rooms"), formData);
            alert('Room added successfully!');
            hideAddRoomModal();
            loadRooms(); // Refresh the room list
        } catch (error) {
            console.error("Error adding room:", error);
            alert('Error adding room. Please try again.');
        }
    }

    // Activity Log
    function setupActivityLog() {
        const activityRef = collection(db, "bookings");
        const q = query(activityRef, orderBy("bookingTime", "desc"), limit(5));

        onSnapshot(q, (snapshot) => {
            const activityList = document.getElementById('activityList');
            if (!activityList) return;

            activityList.innerHTML = snapshot.docs.map(doc => {
                const booking = doc.data();
                return `
                    <div class="activity-item">
                        <span class="activity-icon">🔔</span>
                        <div class="activity-details">
                            <p>${booking.roomType} booked for ${booking.purpose}</p>
                            <small>${new Date(booking.bookingTime).toLocaleString()}</small>
                        </div>
                    </div>
                `;
            }).join('');
        });
    }
});

// Modal Functions
window.showAddRoomModal = function() {
    const modal = document.getElementById('addRoomModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

window.hideAddRoomModal = function() {
    const modal = document.getElementById('addRoomModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addRoomModal');
    if (event.target === modal) {
        hideAddRoomModal();
    }
}

// Room management functions
window.editRoom = async function(roomId) {
    // Implement edit functionality
    console.log('Editing room:', roomId);
}

window.deleteRoom = async function(roomId) {
    if (confirm('Are you sure you want to delete this room?')) {
        try {
            const roomRef = doc(window.db, "rooms", roomId);
            await deleteDoc(roomRef);
            alert('Room deleted successfully');
            loadRooms();
        } catch (error) {
            console.error("Error deleting room:", error);
            alert('Error deleting room. Please try again.');
        }
    }
}
