const API_URL = 'http://localhost:3000/api';

// Auth Helpers
function getToken() {
    return localStorage.getItem('token');
}

function getUserRole() {
    return localStorage.getItem('role');
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'login.html';
    }
    const name = localStorage.getItem('name');
    if (document.getElementById('userGreeting')) {
        document.getElementById('userGreeting').textContent = `Hello, ${name}`;
    }
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}

// Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('name', data.name);
            window.location.href = 'dashboard.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Register
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();

        if (res.ok) {
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

// Chart
let busyHourChart = null;

async function loadChartData() {
    try {
        const res = await fetch(`${API_URL}/analytics/busy-hours`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        if (res.ok) {
            const ctx = document.getElementById('busyHourChart').getContext('2d');
            const hours = data.map(d => d.hour + ':00');
            const counts = data.map(d => d.count);

            if (busyHourChart) {
                busyHourChart.destroy();
            }

            busyHourChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: hours,
                    datasets: [{
                        label: 'Detected Objects (Busy Hours)',
                        data: counts,
                        backgroundColor: 'rgba(37, 99, 235, 0.6)',
                        borderColor: 'rgba(37, 99, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading chart:', error);
    }
}

// User Management (Admin)
async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const users = await res.json();

        if (res.ok) {
            const tbody = document.querySelector('#usersTable tbody');
            tbody.innerHTML = '';
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span style="background: ${user.role === 'admin' ? '#fee2e2' : '#dbeafe'}; padding: 2px 6px; borderRadius: 4px;">${user.role}</span></td>
                    <td>${new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteUser(${user.id})" style="padding: 2px 6px; font-size: 0.8rem;">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'block';
}

async function handleAddUser(e) {
    e.preventDefault();
    const name = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const password = document.getElementById('newUserPassword').value;
    const role = document.getElementById('newUserRole').value;

    try {
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify({ name, email, password, role })
        });

        if (res.ok) {
            alert('User created');
            document.getElementById('addUserModal').style.display = 'none';
            loadUsers();
            document.getElementById('addUserForm').reset();
        } else {
            const data = await res.json();
            alert(data.error);
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteUser(id) {
    if (!confirm('Are you sure?')) return;

    try {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        if (res.ok) {
            loadUsers();
        } else {
            alert('Failed to delete user');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}
