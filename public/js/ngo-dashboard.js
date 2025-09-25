// NGO Dashboard JavaScript

// View donation details
function viewDetails(donationId) {
    // Create modal or navigate to details page
    window.location.href = `/donation/details/${donationId}`;
}

// Mark donation as completed
function markCompleted(donationId) {
    if (confirm('Are you sure you want to mark this donation as completed?')) {
        fetch(`/ngo/complete-donation/${donationId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('Donation marked as completed!', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification('Error updating donation status', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error updating donation status', 'error');
        });
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Auto-refresh dashboard data every 30 seconds
setInterval(() => {
    fetch('/api/ngo/dashboard-data')
        .then(response => response.json())
        .then(data => {
            updateDashboardStats(data);
        })
        .catch(error => {
            console.log('Auto-refresh failed:', error);
        });
}, 30000);

// Update dashboard statistics
function updateDashboardStats(data) {
    if (data.stats) {
        const stats = data.stats;
        
        // Update stat cards if values changed
        const statCards = document.querySelectorAll('.stat-content h3');
        if (statCards.length >= 4) {
            if (statCards[0].textContent !== stats.pending.toString()) {
                statCards[0].textContent = stats.pending;
                animateStatCard(statCards[0].parentElement.parentElement);
            }
            if (statCards[1].textContent !== stats.confirmed.toString()) {
                statCards[1].textContent = stats.confirmed;
                animateStatCard(statCards[1].parentElement.parentElement);
            }
            if (statCards[2].textContent !== stats.volunteers.toString()) {
                statCards[2].textContent = stats.volunteers;
                animateStatCard(statCards[2].parentElement.parentElement);
            }
            if (statCards[3].textContent !== stats.completed.toString()) {
                statCards[3].textContent = stats.completed;
                animateStatCard(statCards[3].parentElement.parentElement);
            }
        }
    }
}

// Animate stat card when updated
function animateStatCard(card) {
    card.style.transform = 'scale(1.05)';
    card.style.transition = 'transform 0.3s ease';
    
    setTimeout(() => {
        card.style.transform = 'scale(1)';
    }, 300);
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    console.log('NGO Dashboard initialized');
    
    // Add tooltips to buttons
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});