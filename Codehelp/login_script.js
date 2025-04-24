import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            // Query users collection for matching email
            const usersRef = collection(window.db, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                alert('User not found. Please register first.');
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            // In a real app, you should use proper password hashing
            if (userData.password === password) {
                // Store user data in sessionStorage
                sessionStorage.setItem('user', JSON.stringify({
                    id: userDoc.id,
                    ...userData
                }));

                // Redirect based on role
                switch(userData.role) {
                    case 'admin':
                        window.location.href = 'admin-panel.html';
                        break;
                    default:
                        window.location.href = 'index.html';
                }
            } else {
                alert('Invalid password');
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert('Error during login. Please try again.');
        }
    });
});
  