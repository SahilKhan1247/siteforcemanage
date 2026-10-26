const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const role = document.getElementById("role").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Owner Login
    if (role === "owner" && username === "sahil" && password === "sahil123") {
        // Store user info in localStorage with correct name
        localStorage.setItem('user', JSON.stringify({
            name: 'Sahil',  // This will show on owner dashboard
            role: 'owner'
        }));
        window.location.href = "/owner-dashboard";
    }
    // Admin Login
    else if (role === "admin" && username === "yogesh" && password === "yogesh123") {
        // Store user info in localStorage with correct name
        localStorage.setItem('user', JSON.stringify({
            name: 'Yogesh',  // This will show on admin dashboard
            role: 'admin'
        }));
        window.location.href = "/admin-dashboard";
    }
    else if (role === "admin" && username === "shahnawaz" && password === "shahnawaz123") {
        // Store user info in localStorage with correct name
        localStorage.setItem('user', JSON.stringify({
            name: 'Shahnawaz',  // This will show on admin dashboard
            role: 'admin'
        }));
        window.location.href = "/admin-dashboard";
    } 
    else if (role === "admin" && username === "ali" && password === "ali123") {
        // Store user info in localStorage with correct name
        localStorage.setItem('user', JSON.stringify({
            name: 'Ali',  // This will show on admin dashboard
            role: 'admin'
        }));
        window.location.href = "/admin-dashboard";
    }
    else {
        document.getElementById("message").innerHTML = "Invalid Username or Password";
        document.getElementById("message").style.color = "red";
    }
});