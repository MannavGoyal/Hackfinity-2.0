import { collection, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    // Password validation
    function validatePassword() {
        if (password.value !== confirmPassword.value) {
            confirmPassword.setCustomValidity("Passwords don't match");
        } else {
            confirmPassword.setCustomValidity('');
        }
    }

    password.addEventListener('change', validatePassword);
    confirmPassword.addEventListener('keyup', validatePassword);

    // Form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        try {
            const email = document.getElementById('email').value;

            // Check if email already exists
            const usersRef = collection(window.db, "users");
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                alert('Email already registered. Please login instead.');
                return;
            }

            const formData = {
                fullName: document.getElementById('fullName').value,
                email: email,
                role: document.getElementById('role').value,
                department: document.getElementById('department').value,
                password: password.value, // In a real app, you should hash this
                registrationDate: new Date().toISOString()
            };

            // Add user to Firebase
            const docRef = await addDoc(collection(window.db, "users"), formData);
            alert('Registration successful! Please login.');
            window.location.href = 'Login_page.html';
        } catch (error) {
            console.error("Error registering user:", error);
            alert('Error during registration. Please try again.');
        }
    });
});